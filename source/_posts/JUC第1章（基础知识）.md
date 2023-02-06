---
title: JUC第1章（基础知识）
categories:
 - [八股,Java,JUC]
date: 2023-02-02 15:32:30
tag:
 - JUC
 - 八股
---
# 一、线程
## 用户空间和内核空间
在操作系统中，内存通常会被分成用户空间（User space）与内核空间（Kernel space）这两个部分。当进程/线程运行在用户空间时就处于用户态，运行在内核空间时就处于内核态：
- 运行在内核态的程序可以访问用户空间和内核空间，或者说它可以访问计算机的任何资源，不受限制，为所欲为，例如协调 CPU 资源，分配内存资源，提供稳定的环境供应用程序运行等。
- 而应用程序基本都是运行在用户态的，或者说用户态就是提供应用程序运行的空间。运行在用户态的程序只能访问用户空间。

区分的目的：
用户态的程序不能随意操作内核地址空间，这样有效地防止了操作系统程序受到应用程序的侵害。

那如果处于用户态的程序想要访问内核空间的话怎么办呢？**就需要进行系统调用从用户态切换到内核态。**

## 操作系统线程
### 用户空间实现线程
**早期**的操作系统
![](Pasted-image-20230202153716.png)
优点：
- 第一点，就是即使操作系统原生不支持线程，我们也可以通过库函数来支持线程；
- 第二点，线程的调度只发生在用户态，**避免**了操作系统从内核态到用户态的**转换开销**。
缺点：
- CPU 的时间片切换是以进程为维度的，所以如果进程中某个线程进行了耗时比较长的操作，那么由于**用户空间中没有时钟中断机制**，就会导致此进程中的其它线程因为得不到 CPU 资源而长时间的持续等待；
- 另外，如果某个线程进行系统调用时比如缺页中断而导致了线程阻塞，此时操作系统也会阻塞住整个进程，即使这个进程中其它线程还在工作。

### 内核空间实现线程
**现代**操作系统，包括 Windows、Linux、Mac OS X 和 Solaris 等，都支持内核线程。**支持多线程的内核就叫做多线程内核**（Multi-Threads Kernel）。
![](Pasted-image-20230202154001.png)
我们可以直接使用操作系统中已经内置好的线程，线程的创建、销毁、调度和维护等，都是直接由操作系统的内核来实现，不需要像用户级线程那样自己设计线程调度等。

这种方式又分一对多、一对一、多对多三种，[参考](https://leetcode.cn/leetbook/read/concurrency/atqmpr/)
- 一对多，特点同用户空间实现多线程
- 一对一，管理线程开销大，**Windows (从 Win95 开始) 和 Linux 都实现了线程的一对一模型**。
- 多对多，复用线程（线程池）

## Java线程
**线程库就是为开发人员提供创建和管理线程的一套 API**。

下面简单介绍下三个主要的线程库：
1）POSIX Pthreads：可以作为用户或内核库提供，作为 POSIX 标准的扩展
2）Win32 线程：用于 Window 操作系统的内核级线程库
3）Java 线程：**Java 线程 API 通常采用宿主系统的线程库来实现**，也就是说在 Win 系统上，Java 线程 API 通常采用 Win API 来实现，在 UNIX 类系统上，采用 Pthread 来实现。

**现今 Java 中线程的本质，其实就是操作系统中的线程。**

其线程库和线程模型很大程度上依赖于操作系统（宿主系统）的具体实现，比如在 Windows 中 Java 就是基于 Win32 线程库来管理线程，且 Windows 采用的是一对一的线程模型。

### 虚拟机栈
线程私有一个虚拟机栈空间。

当然，使用多线程就不可避免的会遇到一个问题，那就是线程的上下文切换（Thread Context Switch），就是说因为某些原因导致 CPU 不再执行当前的线程，转而执行另一个线程。

导致线程上下文切换的原因大概有以下几种：
1）线程的 CPU 时间片用完
2）发生了垃圾回收
3）有更高优先级的线程需要运行
4）线程自己调用了 sleep、yield、wait、join、park、synchronized、lock 等方法

当线程的上下文切换发生时，也就是从一个线程 A 转而执行另一个线程 B 时，需要由操作系统保存当前线程 A 的状态（为了以后还能顺利回来接着执行），并恢复另一个线程 B 的状态。

这个状态就包括每个线程私有的程序计数器和虚拟机栈中每个栈帧的信息等，显然，每次操作系统都需要存储这么多的信息，频繁的线程上下文切换势必会影响程序的性能。

# 二、JAVA内存模型与原子性、可见性、有序性
## Java内存模型
![](Pasted-image-20230202154822.png)

>JMM(Java Memory Model) 规定了所有的变量都存储在主内存（Main Memory）中，每条线程还有自己的工作内存（Working Memory）。
>
>线程的工作内存中保存了被该线程使用的变量的**主内存副本**，线程对变量的所有操作（读取、赋值等）都必须在工作内存中进行，而不能直接读写主内存中的数据。

**这就是并发时内存不一致的元凶！**


## 原子性
JMM 中定义了以下 8 种操作规范来完成一个变量从主内存拷贝到工作内存、以及从工作内存同步回主内存这一类的实现细节。Java 虚拟机实现时必须保证下面提及的每一种操作都是原子的、不可再分的。
- lock（锁定）：作用于主内存的变量，它把一个变量标识为一条线程独占的状态。
- unlock（解锁）：作用于主内存的变量，它把一个处于锁定状态的变量释放出来，释放后的变量才可以被其他线程锁定。
- read（读取）：作用于主内存的变量，它把一个变量的值从主内存传输到线程的工作内存中，以便随后的load动作使用。
- load（载入）：作用于工作内存的变量，它把read操作从主内存中得到的变量值放入工作内存的变量副本中。
- use（使用）：作用于工作内存的变量，它把工作内存中一个变量的值传递给执行引擎，每当虚拟机遇到一个需要使用变量的值的字节码指令时将会执行这个操作。
- assign（赋值）：作用于工作内存的变量，它把一个从执行引擎接收的值赋给工作内存的变量，每当虚拟机遇到一个给变量赋值的字节码指令时执行这个操作。
- store（存储）：作用于工作内存的变量，它把工作内存中一个变量的值传送到主内存中，以便随后的write操作使用。
- write（写入）：作用于主内存的变量，它把store操作从工作内存中得到的变量的值放入主内存的变量

{% note primary %}
- lock，unlock执行锁，操作主内存
- read，write操作主内存
- load，store操作工作内存
- assign，use操作执行引擎
java的实现，保证以上8种类型的操作一定是原子操作。
{% endnote %}

**如何保证原子性？**
处理器提供了总线锁和缓存锁，**Java 提供了锁和循环 CAS 的方式**

## 可见性
**何为可见性**？就是指当一个线程修改了共享变量的值时，其他线程能够**立即**得知这个修改。
所谓可见性就是要把工作内存内容立即写入主内存。

### 如何保证可见性？
- **volatile**：volatile修饰的变量。
- **synchronized**：对一个变量执行 unlock 操作之前，必须先把此变量同步回主内存中（执行 store、write 操作）
- **final**：被 `final` 修饰的字段在构造器中一旦被初始化完成，并且构造器没有把 this 的引用传递出去，那么在其他线程中就能看见 `final` 字段的值。

## 有序性
Java的编译器也有这样的一种优化手段：**指令重排序**（Instruction Reorder）。
但都需要遵守一个规定：
**as-if-serial 语义**：不管怎么重排序，**单线程**环境下程序的执行结果不能被改变。即CPU和编译器不会对存在**数据依赖关系**（1.读后写2.写后读3.写后写）的操作做重排序。

**不同 CPU 之间和不同线程之间的数据依赖性是不被 CPU 和编译器考虑的**。所以as-if-serial的约束在多线程下是无效的。

结论：**CPU 和 Java 编译器为了优化程序性能，会自发地对指令序列进行重新排序。在多线程的环境下，由于重排序的存在，就可能导致程序运行结果出现错误**。

### 如何保证有序性？
#### 单线程
as-if-serial规定
#### 多线程
- `volatile` 本身除了保证可见性的语义外，还包含了禁止指令重排序的语义，所以天生就具有保证有序性的功能。
- `synchronized`保证有序性的理论支撑，仍然是 JMM 规定在执行 8 种基本原子操作时必须满足的一系列规则中的某一个提供的：**一个变量在同一个时刻只允许一条线程对其进行 lock 操作**
- `Happens-before` 原则

{% note primary %}
volatile和synchronized都可以保证可见性和有序性。
final可以保证可见性。
as-if-serial原则保证单线程有序性。
happens-before原则保证多线程有序性。
{% endnote %}

## Happens-Before原则
### 引子
可见性和有序性是矛盾的：我们希望内容足够可见，但又希望提高性能（重排序）。

### 定义
1. 如果一个操作 Happens-before 另一个操作，那么第一个操作的执行结果将对第二个操作**可见**，而且第一个操作的执行顺序排在第二个操作之前。
2. 两个操作之间存在 Happens-before 关系，并不意味着 Java 平台的具体实现必须要按照 Happens-before 关系指定的顺序来执行。如果重排序之后的执行结果，与按 Happens-before 关系来执行的结果一致，那么这种重排序并不非法（也就是说，JMM 允许这种重排序）

{% note primary %}
如果A happens before B
- 一般来说，A需要在**先于**B执行并保证结果**可见**。
- 但如果**重排序**不影响执行结果，也可以改变执行顺序。
{% endnote %}

JMM 其实是在遵循一个基本原则：**只要不改变程序的执行结果（指的是单线程程序和正确同步的多线程程序），编译器和处理器怎么优化都行**。



### 8条Happens-before规则
1）程序次序规则（Program Order Rule）：在一个线程内，按照控制流顺序，书写在前面的操作先行发生（Happens-before）于书写在后面的操作。注意，这里说的是控制流顺序而不是程序代码顺序，因为要考虑分支、循环等结构。
```java
int a = 1; // A  
int b = 2;  // B  
int c = a + b;  // C
```
有A happens-before B，B happens-before C
{% note primary %}
类似于单线程下的as-if-serial
{% endnote %}

2）管程锁定规则（Monitor Lock Rule）：一个 unlock 操作先行发生于后面对同一个锁的 lock 操作。这里必须强调的是 “同一个锁”，而 “后面” 是指时间上的先后。
```java
synchronized (this) { // 此处自动加锁
	if (x < 1) {
        x = 1;
    }      
} // 此处自动解锁
```

3）volatile 变量规则（Volatile Variable Rule）：对一个 volatile 变量的写操作先行发生于后面对这个变量的读操作，这里的 “后面” 同样是指时间上的先后。
![](Pasted-image-20230202164431.png)

>以下将happens before简写为hb
>程序次序规则：1hb2，3hb4
 volatile规则：2hb3
>此时线程A执行writer()，线程B执行reader()
>如果flag == true，则i = a = 42；

{% note primary %}
因为变量flag被violate修饰，所以它不会发生重排序，写变量a一定在写变量flag前执行。同时，因为flag被violate修饰，所以它在写后会强制同步到主内存，即，该操作完成时即同步（**可见性**），在其后执行读变量的话读到的一定是最新值。
{% endnote %}

4）线程启动原则（Thread Start Rule）：Thread 对象的 start() 方法先行发生于此线程的每一个动作。

5）线程终止规则（Thread Termination Rule）：线程中的所有操作都先行发生于对此线程的终止检测，我们可以通过 Thread 对象的 join() 方法是否结束、Thread 对象的 isAlive() 的返回值等手段检测线程是否已经终止执行。

6）线程中断规则（Thread Interruption Rule）：对线程 interrupt() 方法的调用先行发生于被中断线程的代码检测到中断事件的发生，可以通过 Thread 对象的 interrupted() 方法检测到是否有中断发生。

7）对象终结规则（Finalizer Rule）：一个对象的初始化完成（构造函数执行结束）先行发生于它的 finalize() 方法的开始。

8）传递性（Transitivity）：如果操作 A 先行发生于操作 B，操作 B 先行发生于操作 C，那就可以得出操作 A 先行发生于操作 C 的结论。

### “时间上先后发生”和“先行发生”
**两者并无必然关系**
时间上先后发生：指事件A在事件B之前执行
先行发生：指事件A的执行结果对事件B可见
- 符合先行发生关系如果对结果没影响也可能被重排序，导致两者矛盾。
- 时间上先后发生的不一定先行发生，如两个线程，先后调用set，get方法，这样set在get前调用，但不一定先行发生，无法保证set的结果对get可见。

### Happens-before 与 as-if-serial
- as-if-serial 语义保证单线程内程序的执行结果不被改变，Happens-before 关系保证正确同步的多线程程序的执行结果不被改变。
- as-if-serial 语义给编写单线程程序的程序员创造了一个幻境：单线程程序是按程序的顺序来执行的。Happens-before 关系给编写正确同步的多线程程序的程序员创造了一个幻境：正确同步的多线程程序是按 Happens-before 指定的顺序来执行的。


# 三、Java线程
## 创建线程
Thread实现了Runnable接口。
![](Pasted-image-20230202170026.png)
### 1.线程与任务合并
直接继承Thread+重写run方法
```java
// 自定义线程对象
class Thread1 extends Thread {
    @Override
	public void run() {
		// 线程需要执行的任务
		......
  	}
}

// 创建线程对象
Thread1 t1 = new Thread1();

// 一般使用匿名内部类
Thread t1 = new Thread("t1") {
	@Override
	// run 方法内实现了要执行的任务
	public void run() {
		// 线程需要执行的任务
    	......
 	}
};
```

### 2.线程与任务分离(Runnable)
Thread + 实现 Runnable 接口
```java
class MyRunnable implements Runnable {
    @Override
    public void run() {
        // 线程需要执行的任务
    	......
    }
}

// 创建任务类对象
MyRunnable runnable = new MyRunnable();
// 创建线程对象
Thread t2 = new Thread(runnable);

// 匿名内部类
// 创建任务类对象
Runnable runnable = new Runnable() {
    public void run(){
        // 要执行的任务
        ......
    }
};

// 创建线程对象
Thread t2 = new Thread(runnable);
```

### 3.线程与任务分离(Callable)
Thread + 实现 Callable 接口
```java
class MyCallable implements Callable<Integer> {
    @Override
    public Integer call() throws Exception {
        // 要执行的任务
        ......
        return 100;
    }
}
// 将 Callable 包装成 FutureTask，FutureTask也是一种Runnable
MyCallable callable = new MyCallable();
FutureTask<Integer> task = new FutureTask<>(callable);
// 创建线程对象
Thread t3 = new Thread(task);
```
{% note primary %}
Thread只实现了runnable，所以需要将callable包装成一个runnable，通常使用FutureTask进行包装，其是一个Runnable。
{% endnote %}

{% note success %}
start会异步执行，run会同步执行（**使用当前线程执行，没有真正创建新线程**）。
{% endnote %}

## 线程的状态
### 操作系统线程五态模型
![](Pasted-image-20230202170624.png)

### Java线程六态模型
![](Pasted-image-20230202173309.png)
- Java线程模型将操作系统中就绪态（READY）和运行态（RUNNING）两种状态统称为 “RUNNABLE”。
- Java线程新增了WAITING状态和TIMED_WAITING状态，是为了实现线程的手动唤醒。

#### NEW
刚创建，还没start

#### RUNNABLE
调用start后

#### BLOCKED
阻塞于锁，即同步资源获取失败，指`synchronized`。
>LOCK接口下，线程会进入WAITING状态

##### 何时进入BLOCKED状态
1. 首次竞争锁失败 RUNNABLE -> BLOCKED
2. 目标锁被其他线程释放，本线程被唤醒后再次竞争 BLOCKED -> BLOCKED
3. 处于等待状态的线程被唤醒然后竞争进入`synchronized`块 WAITING -> RUNNABLE -> BLOCKED

{% note primary %}
即WAITING状态的线程被唤醒后会先进入RUNNABLE状态，等待系统分配运行资源再竞争锁。
{% endnote %}

#### WAITING
##### RUNNABLE到WAITING
1. 调用`Object.wait`
2. 调用`Thread.join`：当前线程调用t.join()，则当前线程需要等t执行完毕后才继续执行
3. 调用`LockSupport.park`

##### WAITING到RUNNABLE
1. 调用了 `Object.notify`
2. 调用了 `Object.notifyAll`
3. 调用了 `LockSupport.unpark` 恢复某个线程的运行

#### TIMED_WAITING
不同于WAITING，指定时间后返回到Runnable状态。
#### TERMINATED
终止状态，表示当前线程已经执行完毕。

