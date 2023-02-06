---
title: JUC第4章（并发集合与工具类）
categories:
 - [八股,Java,JUC]
date: 2023-02-03 17:36:51
tag:
 - JUC
 - 八股
---
# 一、并发集合
J.U.C 为每一类集合都提供了线程安全的实现，且大多都是以 `Concurrent` 或者 `CopyOnWrite` 开头的。

## Collection接口
1)List
- `Vector`（这个没啥好说的，它就是把 ArrayList 中所有的方法统统加上 `synchronized` ）
- `CopyOnWriteArrayList`

2)Set
- `CopyOnWriteArraySet`
- `ConcurrentSkipListSet`

3)Queue
- BlockingQueue 接口
	- LinkedBlockingQueue
	- DelayQueue
	- PriorityBlockingQueue
	- ConcurrentLinkedQueue
- TransferQueue 接口
	- LinkedTransferQueue
- BlockingDeque 接口
	- LinkedBlockingDeque
	- ConcurrentLinkedDeque

## Map接口
- HashTable（就是把 HashMap 中所有的方法统统加上 synchronized ）
- ConcurrentMap 接口
	- ConcurrentHashMap
	- ConcurrentSkipListMap

## ConcurrentHashMap
### JDK1.7
- ConcurrentHashMap 是由 Segment 数组结构和 HashEntry 数组结构组成
- Segment 继承自 ReentrantLock，是一种可重入锁；HashEntry 是用于真正存储数据的地方
- 一个 ConcurrentHashMap 包含一个 Segment 数组，一个 Segment 里包含一个 HashEntry 数组，当对某个 HashEntry 数组中的元素进行修改时，必须首先获得该元素所属 HashEntry 数组对应的 Segment 锁

![](Pasted-image-20230203174438.png)

```java
static final class Segment<K,V> extends ReentrantLock implements Serializable {
    // 真正存放数据的地方
    transient volatile HashEntry<K,V>[] table;
    // 键值对数量
    transient int count;
    // 阈值
    transient int threshold;
    // 负载因子
    final float loadFactor;

    Segment(float lf, int threshold, HashEntry<K,V>[] tab) {
        this.loadFactor = lf;
        this.threshold = threshold;
        this.table = tab;
    }
}
```
简而言之，将HashCode分片，每片持有一个锁（ReentrantLock），多个桶（HashEntry数组）

**每个 `HashEntry` 是一个链表结构的元素**：
```java
static final class HashEntry<K,V> {
    final int hash;
    final K key;
    volatile V value;
    volatile HashEntry<K,V> next;
}
```
HashEntry维护了一个next指针，并注意value被`volatile`修饰，保证了可见性。

#### put()
源码：
```java
public V put(K key, V value) {
    Segment<K,V> s;
    // 1. 通过 key 定位到具体的 Segment
    int hash = hash(key);
    int j = (hash >>> segmentShift) & segmentMask;
    if ((s = (Segment<K,V>)UNSAFE.getObject
         (segments, (j << SSHIFT) + SBASE)) == null)
        s = ensureSegment(j);
    // 在对应的 Segment 中进行真正的 put
    return s.put(key, hash, value, false);
}
```

1. 对key做hash处理（1次hash）
2. 对key做掩码等处理（2次hash）
3. 获取对应segment，如果为空则创建。
4. 在对应segment上执行put操作（使用1次hash的值）
5. 获取segment的锁，失败则自旋直到成功
6. 成功后判断是否需要扩容HashEntry数组，然定位、插入。

注意这里获取segment时，对key做了两次hash处理，目的是尽可能将将数据打散到各个segment。

#### get()
1. 通过二次hash定位到具体segment
2. 通过一次hash定位到具体元素

### JDK1.8
不同于 JDK 1.7 版本的 Segment 数组 + HashEntry 链表。
- JDK 1.8 版本中的 ConcurrentHashMap 直接抛弃了 Segment 锁，一个 ConcurrentHashMap 包含一个 Node 数组（和 HashEntry 实现差不多）
- 每个 Node 是一个链表结构，并且在链表长度大于一定值时会转换为红黑树结构（TreeBin）。

```java
static class Node<K,V> implements Map.Entry<K,V> {
    final int hash;
    final K key;
    volatile V val;
    volatile Node<K,V> next;

    Node(int hash, K key, V val, Node<K,V> next) {
        this.hash = hash;
        this.key = key;
        this.val = val;
        this.next = next;
}
```

TreeBin继承了Node，当Node链表长度过长时，会升级为TreeBin。
![](Pasted-image-20230203175817.png)
结构图：
![](Pasted-image-20230203175855.png)

使用**synchronized+CAS**保证并发安全性。

Node 数组其实就是一个哈希桶数组，每个 Node 头节点及其所有的 next 节点组成的链表就是一个桶，只要锁住这个桶的**头结点**，就不会影响其他哈希桶数组元素的读写。

>JDK 1.8 没有使用 ReentrantLock 而是改用 synchronized，足以说明新版 JDK 对 synchronized 的优化确有成效。

#### put()
1. 根据key计算hash
2. 根据hash定位Node
	- 若Node为空，则CAS写入（失败则自旋，重新判断Node是否为空）；
	- 若不为空但hashcode == MOVED == -1，需要扩容
	- 若不为空且不需要扩容，则利用synchronized写入数据。

#### get()
1. 根据key计算hash
2. 根据hash定位Node
3. 判断节点类型并搜索

## BlockingQueue
阻塞队列含义：
- **当队列满时，队列会阻塞向其中插入元素的线程，直到队列不满**
- **当队列为空时，获取队列中元素的线程会一直等待，直到队列变为非空**
应用场景：生产者-消费者
![](Pasted-image-20230203181313.png)
模式：**当队列满时，生产者阻塞，当队列空时，消费者阻塞**。

### Java中的BlockingQueue
![](Pasted-image-20230203181429.png)
Java 中提供了一个阻塞队列的接口 BlockingQueue 以及 7 个具体的实现（6 个单向队列和 1 个双端队列）：
- ArrayBlockingQueue：一个由数组结构组成的有界阻塞队列
- LinkedBlockingQueue：一个由链表结构组成的有界阻塞队列
- PriorityBlockingQueue：一个支持优先级排序的无界阻塞队列
- DelayQueue：一个使用 PriorityBlockingQueue 实现的无界阻塞队列
- SynchronousQueue：一个不存储任何元素的阻塞队列
- LinkedTransferQueue：一个由链表结构组成的无界阻塞队列
- LinkedBlockingDeque：一个由链表结构组成的双向阻塞队列

#### 有界队列与无界队列
以LinkedBlockingQueue为例：
![](Pasted-image-20230203181546.png)
- 带参构造函数需要指定队列的长度，并且当**队列满了之后也不会对其进行扩容**，这就是有界队列
- 而**无参构造函数赋给队列的长度是 Integer.MAX_VALUE**，显然现实几乎不会有这么大的容量超过 Integer.MAX_VALUE，所以从使用者的体验上，可以无限入队，相当于无界队列

### 基本原理
主要方法：
![](Pasted-image-20230203181646.png)
方法区别：
![](Pasted-image-20230203181641.png)

主要研究："阻塞进" `put()` 和 "阻塞出" `take()`

阻塞队列利用`Lock`中的`Condition`使用**通知模式**，实现对生产者，消费者的通知。

以`ArrayBlockingQueue`为例，其拥有两个condition成员变量：
![](Pasted-image-20230203181939.png)

#### put()
```java
public void put(E e) throws InterruptedException {
    checkNotNull(e);
    final ReentrantLock lock = this.lock;
    // 获取可中断锁
    lock.lockInterruptibly();
    try {
        // 如果当前元素个数等于队列的最大长度，则调用 notFull.await() 进行等待
        while (count == items.length)
            notFull.await();
        // 向队列中插入元素
        enqueue(e);
    } finally {
        // 入队成功，释放锁
        lock.unlock();
    }
}
```

1. 获取可中断锁
2. 判断队列空间
	- 如果队列空间不足，则在notFull队列中等待，被唤醒后继续尝试入列（`enqueue`，该方法中调用了notEmpty.signal()，提醒消费者）。
	- 如果队列空间足够，入列（`enqueue`）
3. 释放锁

#### take()
```java
public E take() throws InterruptedException {
    final ReentrantLock lock = this.lock;
    // 获取可中断锁
    lock.lockInterruptibly();
    try {
        // 如果队列中没有元素，则调用 notEmpty.await() 进行等待
        while (count == 0)
            notEmpty.await();
        // 从队列中取出元素
        return dequeue();
    } finally {
        // 出队成功，释放锁
        lock.unlock();
    }
}
```
1. 获取可中断锁
2. 判断队列是否为空
	- 若为空，则在在notEmpty队列中等待，被唤醒后再尝试获取
	- 若不为空，则获取元素(`dequeue`，notFull.signal()，提醒生产者)
3. 释放锁

![](Pasted-image-20230203182814.png)


### 非阻塞队列
ConcurrentLinkedQueue，使用CAS保证线程安全。
![](Pasted-image-20230203182841.png)


## CopyOnWriteArrayList
`Vector` 其实是非常粗暴的给ArrayList所有方法都加上了锁，导致并发度不高。
### 问题
ArrayList迭代时，不允许集合被修改。因此需要避免多线程下ArrayList线程不安全的问题。
可以通过读写锁避免读时写，但如果我们希望无论合适都可以读取到数据，则需要COW的思想。

### CopyOnWrite
COW放弃了这种数据实时性，通过满足数据的最终一致性从而提升并发度。顾名思义，写时复制，Redis的主从复制就是使用的这种思想。
写操作时，先创建目标对象的拷贝，对拷贝对象写完成后替换原对象。

### 源码
CopyOnWriteArrayList维护一个底层数组，其可以被替换。
![](Pasted-image-20230203183841.png)

#### add()
![](Pasted-image-20230203183612.png)
1. 加重入锁
2. 复制数组
3. 改写数组元素并替换原数组对象
4. 释放锁

### 延时感知
读线程读取数组元素时，可能读到的是旧数组。

### COW缺点
- 复制严重消耗**性能**。
- 会产生大量数组垃圾，容易造成GC（**内存**）。
- 对实时性要求高的化也不建议使用。


# 二、并发工具类
J.U.C 为我们封装了一些有用的控制并发流程的工具，CountDownLatch、CyclicBarrier、Semaphore 以及 Exchanger。
## CountDownLatch
倒计时器，一个线程执行一定的时间后另一个线程才可以开始（继续）执行。
### join()
join方法也可以提供类似的效果：
```java
Thread threadA = new Thread(new Runnable() {            
    @Override   
    public void run() {    
		System.out.println("first thing finish");   
    }        
});          

threadA.start();     
threadA.join();   
System.out.println("FINISH");    
```
主线程会等待A线程完成后再执行FINISH打印。
join()方法还提供了`join(long millis)` 和 `join(long millis,int nanos)`，可以设置超时时间和时间单位。

join的底层原理：**wait/notify** 等待通知机制。

### CountDownLatch
![](Pasted-image-20230203184730.png)
![](Pasted-image-20230203184732.png)

- CountDownLatch 的构造函数接收一个 int 类型的参数（count）作为计数器。
- 每调用一次 countDown 方法，这个 count 就会减 1。
- 当 count 不为 0 的时候，我们可以调用 CountDownLatch 的 await 方法阻塞当前线程，直到 count 变为 0，当前线程才可以继续往下执行。

使用：
```java
static CountDownLatch countDownLatch = new CountDownLatch(2);

new Thread(new Runnable() {            
    @Override   
    public void run() {    
        System.out.println("first thing finish");   
        countDownLatch.countDown(); // count --
        System.out.println("second thing finish");        
        countDownLatch.countDown(); // count --
    }        
}).start();
countDownLatch.await(); // 主线程被阻塞住，直到 count = 0
System.out.println("FINISH");    
```

{% note primary %}
join是必须等待其他线程执行完或超时才继续执行，这里则通过信号量的方式实现对主线程的通知。
{% endnote %}

## CyclicBarrier
循环栅栏，**让一组线程到达一个屏障（也可以叫同步点）时被阻塞，直到最后一个线程到达屏障时，屏障才会开门，所有被屏障拦截的线程才会继续运行**。
```java
static CyclicBarrier cyclicBarrier = new CyclicBarrier(2);

new Thread(new Runnable() {            
    @Override   
    public void run() {    
        cyclicBarrier.await(); // 子线程已达到屏障
        System.out.println("child Thread");   
    }        
}).start();

cyclicBarrier.await(); // 主线程已到达屏障
System.out.println("main Thread");  
```

![](Pasted-image-20230203185034.png)

`CyclicBarrier`还提供一个更高级的构造函数`CyclicBarrier(int parties，Runnable barrier-Action)`，就是说，当抵达屏障的线程数量满足parties后，在所有被阻塞的线程继续执行之前（即屏障打开之前），率先执行`barrier-Action`方法。

{% note primary %}
都是通过调用工具类对象的`await`方法实现线程阻塞，然后工具类在合适的时候会唤醒线程。
{% endnote %}

## Semaphore
信号量，用许可证来理解更好。
```java
Semaphore s = new Semaphore(20);
//申请许可证
s.acquire();
//释放许可证
s.release();
```
就像餐厅的座位有限一样，需要排队恰饭一样。
![](Pasted-image-20230203185405.png)
其最大的作用就是限流，和阻塞队列的原理有些相似，只不过阻塞队列限制的是排队的长度，这里限制的是恰饭的人数。

## Exchanger
两个线程想要互相阻塞式地交换信息。
```java
static final Exchanger<String> exgr = new Exchanger<>();

public void test(){
    Thread t1 = new Thread(new Runnable() {
        @Override  
        public void run() {  
            try{
                String A = exgr.exchange("aaa");  
                System.out.println("B发生的消息："+A);  
            }catch (Exception e){ 
            }   
        }  
    });  
    Thread t2 = new Thread(() -> {  
        try{  
            String B = exgr.exchange("bbb");  
            System.out.println("A发生的消息："+B);  
        }catch (Exception e){ 
        }
    });  
    t1.start();  
    t2.start();  
}
```
交换到信息后，两个线程各自继续执行。

## ThreadLocal
ThreadLocal称不上是一个工具类，但其能起到隔离线程之间数据的效果。
线程在ThreadLocal中设置的值是线程私有的。

### 使用
```java
private static final ThreadLocal<String> threadLocal = new ThreadLocal<>();  
public static void main(String[] args) {  
	Main main = new Main();  
	threadLocal.set("aa");  
	threadLocal.get();  
	System.out.println(threadLocal.get());  
}
```

### 源码
#### 构造函数
![](Pasted-image-20230203191027.png)
#### set()
![](Pasted-image-20230203191043.png)
1. 通过线程t获取ThreadLocalMap
2. 通过ThreadLocalMap设置（this，value）

解释：
1）ThreadLocalMap
![](Pasted-image-20230203191419.png)
ThreadLocalMap是ThreadLocal的内部类，其中，Entry是map中的节点，从来存储真正的k-v数据。所以当向ThreadLocal中set值时，实际上是在给ThreadLocalMap赋值，即，在ThreadLocalMap中创建新的Entry节点。
2）`map.set(this,value)`
ThreadLocal是一个公共对象，且可以有多个ThreadLocal存在。
- 同一个ThreadLocal在不同的线程下代表不同的值。
- 使用一个线程查看不同的ThreadLocal也具有不同的意义。

因此，实际上只有`ThreadLocalMap`是线程私有的，`ThreadLocalMap`中的Entry存储着真正的值，通过这个map，以不同的`ThreadLocal`为键，即可存储本线程中不同`ThreadLocal`的值。
#### get()
![](Pasted-image-20230203191609.png)

#### 结构图
![](Pasted-image-20230203191704.png)
可以看出来，一个 ThreadLocal 只能保存一个 "key : value" 键值对，并且各个线程的数据互不干扰。

### ThreadLocal经典之内存泄漏
![](Pasted-image-20230203192458.png)

**Entry结构**
ThreadLocalMap，底层保存了Entry数组，作为存储的桶。

Entry结构持有：
- 虚引用threadLocal
- 实引用value

在构造Entry（继承了`WeakReference<ThreadLocal>`，因此其可以虚引用一个`ThreadLocal`字段）的时候，会顺便把对应的`ThreadLocal`设置它的一个弱引用，空间不足且满足条件时可以将其释放。

**如何判断Entry的Index**
使用`(threadLocal.threadLocalHashCode & capacity-1)`作为entry在数组中存放的地址。
这种设计是基于不会发生hash冲突的预期而实现的，数组中一个桶只放一个entry。

**为什么要使用弱引用保存key？**
`ThreadLocalMap`的生命与`Thread`一样长，若使用了`ThreadLocal`作为键保存值而不进行回收，则会造成内存泄漏。

**存在的问题**
虽然key被设计成弱应用了，可以从某种程度上避免内存泄漏，但是，value仍然是强引用！需要**显式地调用`remove`方法**。

**为什么value不设置成弱引用**
因为不清楚这个value是否存在其他引用，如果value是弱引用对象，但存在其他引用，则GC时可能直接将value回收了。但ThreadLocal还在使用期间，导致get获取到null。

**要保证value的生命周期比key的生命周期长。**

