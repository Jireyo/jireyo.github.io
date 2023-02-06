---
title: JUC第5章（线程池）
categories:
 - [八股,Java,JUC]
date: 2023-02-03 20:19:32
tag:
 - JUC
 - 八股
---
# 一、线程池工作原理
## 线程池的好处
- 降低资源消耗：通过重复利用已创建的线程降低线程创建和销毁造成的消耗。
- 提高响应速度：当任务到达时，任务可以不需要等到线程创建就能立即执行。
- **提高线程的可管理性**：系统的资源是有限的，所以线程作为一个消耗系统资源的东西，就不可能无限制的创建。这样，我们通过引入线程池，对线程进行进行统一地分配和监控，降低手动管理每个线程的复杂度。

>阿里巴巴的《Java 开发手册》中也强制规定了：**线程资源必须通过线程池提供，不允许在应用中自行显式创建线程**。

## 线程池工作原理
线程池的组成：
- 核心线程池（存储线程）
- 工作队列（存储任务）

![](Pasted-image-20230203232839.png)
当提交一个新任务到线程池时，线程池的处理流程分如下三步走：
1. 判断核心线程池里的线程是否都在执行任务（**核心线程池是否已满**）：
	- 如果不是，则创建一个新的工作线程来执行任务。
	- 如果核心线程池里的线程都在执行任务，则进入下一步。
2. 判断**工作队列是否已满**：
	- 如果工作队列没有满，则将新提交的任务存储在这个工作队列里。
	- 如果工作队列满了，则进入下一步。
3. 判断线程池中的所有线程是否都处于工作状态（**线程池是否已满**）：
	- 如果没有，则创建一个新的工作线程来执行任务。
	- 如果已经满了，则交给**饱和策略**来处理这个任务。
4. 饱和策略有以下几种：
	- AbortPolicy（默认）：无法处理新任务时直接抛出异常
	- CallerRunsPolicy：使用调用者所在的线程来运行新任务（这个很好理解，一般我们都是主线程提交任务，然后扔进线程池执行，对吧。当线程池满了后，如果使用这个策略，就会调用主线程来执行新任务）
	- DiscardOldestPolicy：丢弃队列里最近的一个任务，并将新任务加入队列
	- DiscardPolicy：不做任何处理，直接将新任务丢弃掉，粗暴！


![](Pasted-image-20230203233411.png)
{% note primary %}
总的思路是**尽量使用核心线程池的线程执行任务**，实在不行再请求新线程，还不行就走饱和策略。
{% endnote %}

**工作队列何时出列？**
线程在执行完任务后，就会主动从工作队列中获取任务来执行。

**为什么这样设计？**
创建新线程永远不是最优先的选择，而是尽可能地复用已存在的线程。

# 二、创建线程池
线程池的创建方法总体来说可分为 2 大类：
- 一种是通过 `Executors` 创建的线程池
- 另一种是通过 `ThreadPoolExecutor` 创建的线程池

## Executors
Executors 封装了 6 种方法，对应创建 6 种不同的线程池：
- FixedThreadPool
- CachedThreadPool
- SingleThreadExecutor
- WorkStealingPool
- ScheduledThreadPool
- SingleThreadScheduledExecutor

### FixedThreadPool
创建一个固定大小的线程池，可控制并发的线程数，超出的线程会在队列中等待。
![](Pasted-image-20230203234231.png)
基本使用：
```java
// 创建包含 2 个线程的线程池
ExecutorService fixedThreadPool = Executors.newFixedThreadPool(2);

// 创建任务
Runnable runnable = new Runnable() {
    @Override
    public void run() {
        System.out.println(Thread.currentThread().getName() + " 执行任务");
    }
};
fixedThreadPool.submit(runnable);
fixedThreadPool.execute(runnable);
```

execute和submit 
- execute用于提交不需要返回值的任务，所以无法判断任务是否被线程池执行成功。
- submit用于提交需要返回值的任务，线程池会返回一个 Future 类型的对象。

### CachedThreadPool
创建一个可缓存的线程池，若线程数超过处理任务所需（供 > 求），多出来的线程缓存一段时间后会被回收掉；而如果线程数不够（供 < 求），则线程池会新建一些线程出来。
![](Pasted-image-20230203234225.png)

### SingleThreadExecutor
创建只包含一个线程的线程池，它可以保证任务先进先出的执行顺序。也就说，先被扔进线程池的任务，就会被先执行
![](Pasted-image-20230203234321.png)


### WorkStealingPool
![](Pasted-image-20230203234401.png)
和 SingleThreadExecutor相反，WorkStealingPool创建的是一个抢占式执行的线程池，也即任务执行顺序不确定。

### ScheduledThreadPool
创建一个可以执行延迟/定时任务的线程池。
![](Pasted-image-20230203234413.png)
这时就不再使用`execute/submit`了，而是`schedule`。
![](Pasted-image-20230203234500.png)

### SingleThreadScheduledExecutor
这个方法创建的是仅包含 1 个线程线程池，并且它可以执行延迟任务。

## ThreadPoolExecutor
上述Executors的6种方法，其底层最终调用的都是ThreadPoolExecutor的构造函数，只不过参数不同。可以简单理解为，`ThreadPoolExecutor`是最基本的创建线程池的方式，`Executors`对其做了一定的封装。

>在阿里巴巴的《Java 开发手册》上，明确规定了：
>【强制要求】线程池不允许使用 Executors 去创建，而是通过 ThreadPoolExecutor 的方式，这样的处理方式让写的同学更加明确线程池的运行规则，规避资源耗尽的风险。

### 构造函数
![](Pasted-image-20230203234656.png)
1. corePoolSize：核心线程数
2. maximumPoolSize：最大线程数
3. keepAliveTime：最大线程数可以存活的时间，当线程中没有任务执行时，最大线程就会销毁一部分，最终保持核心线程数量的线程。
4. unit：即keepAliveTime的单位
5. workQueue：阻塞队列
6. threadFactory：线程工厂，主要用来创建线程，默认为正常优先级、非守护线程。
7. handler：拒绝策略，即饱和策略
	- AbortPolicy (默认策略)：拒绝执行并抛出异常
	- CallerRunsPolicy：使用当前调用的线程来执行此任务
	- DiscardOldestPolicy：抛弃阻塞队列头部（最旧）的一个任务，并执行当前任务
	- DiscardPolicy：忽略并抛弃当前任务

{% note primary %}
**核心线程数**、**最大线程数**、**阻塞队列**是限制大小的。
**存活时间**和**单位**是管理非核心线程的。
**工厂**管理生成线程策略。
**处理器**决定饱和策略。
{% endnote %}

后两个参数一般默认，常用的是5参数版本：
![](Pasted-image-20230203235208.png)


### 为什么不要使用Executors创建线程池
- FixedThreadPool 和 SingleThreadPool：允许的请求队列长度为 Integer.MAX_VALUE，可能会堆积大量的请求，从而导致OOM。
- CachedThreadPool：允许的创建线程数量为Integer.MAX_VALUE，可能会创建大量的线程，从而导致OOM。

# 三、Executor
Executor是一个接口，更是一个框架！
![](Pasted-image-20230203235700.png)

![](Pasted-image-20230204002439.png)

- 任务：包括被执行任务需要实现的接口：`Runnable/Callable`接口
- 任务的执行：包括任务执行机制的核心接口`Executor`，以及继承自 `Executor`的`ExecutorService`接口。
	- `Executor`框架有两个关键类实现了`ExecutorService`接口，分别为`ThreadPoolExecutor`和`ScheduledThreadPoolExecutor`
- 任务执行的结果：包括接口`Future`和实现`Future`接口的`FutureTask`类。

## 工作流程
![](Pasted-image-20230204002726.png)
1. 创建Runnable/Callable
2. 提交给ExecutorService，ExecutorService根据具体实现来处理任务。
3. 返回Future/FutureTask(FutureTask是Future的实现类)

## Executors、Executor、ExecutorService
区别：
- `ExecutorService`接口继承了`Executor`接口
	- `execute()`方法在`Executor`中定义，而`submit()`在`ExecutorService`中定义。
	- `ExecutorService`提供了很多控制线程池的方法，如`shutdown`。
- `Executors`只是一个工具类，快速生成`ExecutorService`的子类，如`ThreadPoolExecutor`和`ScheduledThreadPoolExecutor`。

# 四、配置线程池
![](Pasted-image-20230204003341.png)
三个参数：`corePoolSize`核心线程数、`maximumPoolSize`最大线程数和 `workQueue`阻塞队列，就是我们在创建线程池时应该关注的重点。

## 场景
### 线上与线下
**线上 - 响应速度优先**：需要快速响应用户的请求，应该不设置阻塞队列去缓冲并发任务，调高 `corePoolSize` 和 `maxPoolSize` 去创造尽可能多的线程快速执行任务。
**线下 - 吞吐量优先**：需要尽可能快地批量处理任务，应该设置阻塞队列去缓冲并发任务，调整合适的`corePoolSize`去设置处理任务的核心线程数。


### 任务类型
**CPU密集型任务**：充分利用CPU，设置corePoolSize为CPU数+1（备用，防止其他线程暂停不工作）。
**IO密集型任务**：尽可能多配置核心线程，IO等待时让其他线程占用CPU。
主要还是看实际生产情况灵活调整。