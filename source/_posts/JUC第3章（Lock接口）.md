---
title: JUC第3章（Lock接口）
categories:
 - [八股,Java,JUC]
date: 2023-02-02 17:31:55
tag:
 - JUC
 - 八股
---
# 一、CAS
## 概念
**乐观锁的目的就是在不使用锁（悲观锁）的情况下保证线程安全**。
乐观锁在 Java 中是采用 CAS 算法实现的，J.U.C 包中的原子类就是通过 CAS 算法来实现了乐观锁。
使用这种 CAS 算法的代码也常被称为 **无锁** 编程（Lock-Free）。
**现代处理器基本都已经内置了实现 CAS 的指令，比如 x86 指令集上的 `CAMPXCHG`**。
当多个线程尝试使用 CAS 同时更新主内存中的同一个变量时，只有一个线程可以成功更新变量的值，其他的线程都会失败，失败的线程并不会挂起，而是会自旋重试。

**CAS**（Compare And Set）的步骤为：
- 读取主内存值
- 将读取到的值再与主内存值比较
- 将新值交换到该变量

## CAS三大问题
### ABA问题
![](Pasted-image-20230203125031.png)
#### 解决
**在变量值前面追加上版本号，每次变量更新的时候把版本号加 1，那么 A→B→A 就会变成 1A→2B→3A**。
从 Java 1.5 开始，JDK 的 Atomic 包里提供了一个类 `AtomicStampedReference` 来解决 ABA 问题，把变量放在 `AtomicStampedReference` 类中即可。

### 只能保证一个共享变量的原子操作
x86 指令集上使用 CAMPCHG 来实现 CAS 操作，我们在一些源码里看到的 CAS 操作其实都是对这条底层指令的封装罢了，而**这条指令的功能就是一次只原子地修改一个变量**。

#### 解决
1. 使用锁
2. 将变量合并，操作后再拆解

从 Java 1.5 开始，JDK 提供了 AtomicReference 类来保证引用对象之间的原子性，这样我们就可以把多个变量封装在一个对象里来进行 CAS 操作。

### 循环时间开销
失败时一直重试，开销过大，CPU空转

#### 解决
使 JVM 支持底层指令 pause，这个指令的功能就是当自旋失败时让 CPU 睡眠一小段时间再继续自旋，其有两个作用：
1）降低读操作的频率；
2）避免在退出循环的时候因 内存顺序冲突（Memory OrderViolation） 而引起 CPU 流水线被清空（CPU PipelineFlush）。
>内存顺序就是CPU访问内存的顺序，持锁线程store后，其他线程load才可以获取锁，但如果重排序，会导致load到的数据无效，此时会清空流水线再重排序，而pause可以减少重排序所耗费的时间。

# 二、Unsafe与原子类
## Unsafe 类浅析
Unsafe 类存在于 sun.misc 包中，单从名称看来就可以知道该类是非安全的，因为其内部方法操作可以像 C 的指针一样直接操作内存（全是本地方法）。

所以事实上 Java 官方也不建议我们直接去使用 Unsafe 类。J.U.C 中 CAS 操作的执行依赖于 Unsafe 类的方法。

CAS相关方法：
![](Pasted-image-20230203125836.png)
将参数重命名：
```java
public final native boolean compareAndSwapXxx(Object o, long offset, Object expected, Object update)
```
- 第一个参数 o 为给定对象，即包含要修改字段的对象
- 第二个参数 offset 为对象内存的偏移量，通过这个偏移量可以迅速定位字段并设置或获取该字段的值
- 第三个参数 expected 表示期望值
- 第四个参数 update 表示要设置的值

## 原子类
在 Atomic 包里一共提供了 13 个类，属于 4 种类型的原子更新方式，分别是：
- 原子更新基本类型
- 原子更新数组
- 原子更新引用
- 原子更新属性（字段）

### 原子更新基本类型
- `AtomicBoolean`：原子更新布尔类型
- `AtomicInteger`：原子更新整型
- `AtomicLong`：原子更新长整型

构造函数：
![](Pasted-image-20230203134452.png)
常用方法：
- `addAndGet`
- `compareAndSet`
- `getAndIncrement`、`getAndDecrement`
- `getAndSet`

这些方法底层都是调用Unsafe类的方法进行CAS操作。
对于其他基本类型如char，float，double等，会先把其他类信息转换成int/long类型再进行操作。

### 原子更新数组
- `AtomicIntegerArray`：原子更新整型数组里的元素
- `AtomicLongArray`：原子更新长整型数组里的元素
- `AtomicReferenceArray`：原子更新引用类型数组里的元素

构造函数：
![](Pasted-image-20230203134948.png)
常用方法略，就是多一个数组索引。

### 原子更新引用
- `AtomicReference`：原子更新引用类型
- `AtomicReferenceFieldUpdater`：原子更新引用类型里的字段
- `AtomicMarkableReference`：原子更新带有标记位的引用类型

构造函数：
![](Pasted-image-20230203135105.png)
基本用法：
```java
private static AtomicReference<User> reference = new AtomicReference<>();

public static void main(String[] args) {
	User user1 = new User("user1", 16);                
	reference.set(user1);            
	
	User user2 = new User("user2", 18);
	reference.compareAndSet(user1, user2);
	
	System.out.println(reference.get().getName()); // "user2"
}
```

### 原子更新字段
- AtomicIntegerFieldUpdater：原子更新整型字段
- AtomicLongFieldUpdater：原子更新长整型字段
- AtomicStampedReference：原子更新带有版本号的引用类型

这三个方法不同于前面的简单封装，而是被称为原子更新器，构造函数如下：
![](Pasted-image-20230203135443.png)
即都是通过抽象类的静态方法获取更新器实例，基本用法：
```java
public class AtomicIntegerFieldUpdaterTest {
    private static AtomicIntegerFieldUpdater updater = AtomicIntegerFieldUpdater.newUpdater(User.class, "age"); // 原子更新 User 类的 age 字段
    public static void main(String[] args) {
        User user = new User("user1", 1); // 旧值是 1
        int oldValue = updater.getAndAdd(user, 5); // 原子更新为 5
        System.out.println(oldValue); // 1
        System.out.println(updater.get(user)); // 6
    }
} 
```

# 三、Lock接口
## 概述
**为什么需要Lock？**
synchronized锁隐式的限定了锁的获取和释放位置，导致某线程获取锁的顺序总是先获取先释放（栈式），满足不了更多的需要，而lock手动获取释放。

**使用方法**
```java
class Test {
    public void test1() {
		ReentrantLock reentrantLock = new ReentrantLock();
         // 加锁
		reentrantLock.lock();
        
		// do something ....
        
         // 解锁
       	 reentrantLock.unlock();
    }
}
```

## Lock接口

```java
public interface Lock {
    void lock();

    void lockInterruptibly() throws InterruptedException;

    boolean tryLock();

    boolean tryLock(long time, TimeUnit unit) throws InterruptedException;

    void unlock();

    Condition newCondition();
}
```

- lock()：尝试获取锁，获取锁成功后返回
- lockInterruptibly()：可中断的获取锁。所谓可中断的意思就是，在锁的获取过程中可以中断当前线程
- tryLock()：尝试非阻塞的获取锁。不同于 lock() 方法在锁获取成功后再返回，该方法被调用后就会立即返回。如果最终获取锁成功返回 true，否则返回 false
- tryLock(long time, TimeUnit unit)：超时的获取锁。如果在指定时间内未获取到锁，则返回 false
- unlock()：释放锁
- newCondition()：当前线程只有获得了锁，才能调用 Condition 接口的 await 方法。Condition 接口本文就先不做详细赘述了

Lock是一个**接口**，它规定所有的锁要实现这6个方法(调用层)从而实现锁的功能。

## Lock底层：AQS
Lock 接口的实现基本都是通过聚合了一个队列同步器（AbstractQueuedSynchronizer，AQS）的**子类**来完成线程访问控制的。
比如 ReentrantLock：
![](Pasted-image-20230203140146.png)
而AbstractQueuedSynchronizer：
![](Pasted-image-20230203140222.png)
总结：
- `Lock`的实现类（如`ReentrantLock`）基本都是通过使用它的一个`内部队列`（sync）来实现线程的控制访问的。
- `ReentrantLock`有一个内部抽象类`Sync`，该类继承另一个抽象类`AbstractQueuedSynchronizer`，并完成部分方法重写。
- `ReentrantLock`还有一些非抽象类，继承`Sync`，并对其部分方法进行重写，实现不同的队列控制，所谓的内部队列，就是某个非抽象类的实例。
- `AbstractQueuedSynchronizer`被称作同步器，其将一些方法开放给子类写，实现了不同需求的锁控制。

### AQS方法
>理解 模板方法设计模式 是理解 AQS 的关键，所谓模板方法可以简单理解为不可被子类重写的方法，模板方法相当于一个骨架，也就是说整体骨架不能被改变，里面具体实现细节可以开放给子类进行重写。

- AQS 中的模板方法 `acquire()`，可以看到被 `final` 关键字标识了，不可被继承重写。
- 但是这个模板方法中调用的 `tryAcquire` 就是开放给子类进行重写的。

>谈谈对AQS的理解：
>AQS 是一个抽象类，是用来构建锁或者其他同步组件的**基础框架**，它使用了一个 **volaitle 修饰的 int 成员变量 state 表示同步状态**，通过内置的 FIFO 双向队列（源码注释上写的 CLH（Craig，Landin，and Hagersten） 队列（三个人名的简称），其实就是一个先进先出的双向队列）来完成线程们获取资源的时候的排队工作。
>具体来说，如果某个线程请求锁（共享资源）失败，则该线程就会被加入到 CLH 队列的末端。当持有锁的线程释放锁之后，会唤醒其后继节点，这个后继节点就可以开始尝试获取锁。

### 成员变量state
```java
private volatile int state;

protected final int getState() {
    return state;
}

protected final void setState(int newState) {
    state = newState;
}

protected final boolean compareAndSetState(int expect, int update) {
    return unsafe.compareAndSwapInt(this, stateOffset, expect, update);
}
```
- 加锁时，通过CAS，state+1
- 释放时，通过CAS，state-1

### CLH队列
#### addWaiter方法
`addWaiter`，通过CAS创建一个node并添加到队列尾部。
![](Pasted-image-20230203143108.png)
这里注意有一个添加Waiter时还需要指定一个Node对象`mode`，这是Node类的静态字段，主要其标记作用，用来指定是共享锁还是排他锁（可以看后面的Node节点中源码和AQS两套模式）。

![](Pasted-image-20230203142026.png)
首节点的线程 A 在释放同步资源时，将会唤醒器其后继节点 B，而后继节点 B 被唤醒后，就会重新尝试加锁，同样还是 CAS 操作给 state 变量加 1，如果成功，就**将自己设置为首节点**。
![](Pasted-image-20230203142115.png)

设置首节点是不需要CAS的，因为当线程能否设置首节点时，说明已经获取到了同步资源，只有一个线程能做到（只有一个线程可以将state状态从0 CAS到 1）。

#### enq方法
addWaiter方法中调用了enq方法，这个方法通过死循环的方式使用CAS将节点设置成尾节点，即enq方法将**并发添加节点的请求变成“串行化”了**。
![](Pasted-image-20230203142655.png)

### Node节点
```java
static final class Node {
	static final Node SHARED = new Node();  
	/** Marker to indicate a node is waiting in exclusive mode */  
	static final Node EXCLUSIVE = null;

    static final int CANCELLED =  1;
    static final int SIGNAL    = -1;
    static final int CONDITION = -2;
    static final int PROPAGATE = -3;

    volatile int waitStatus;

    volatile Node prev; // 前驱节点
    volatile Node next; // 后继节点

    volatile Thread thread; // 当前线程的引用

    Node nextWaiter; //标记节点是共享锁还是排他锁
}
private transient volatile Node head; // 头节点
private transient volatile Node tail; // 最后一个节点
```
每个Node拥有其**线程的引用**和一个**状态**，主要关注下面两个状态：
- `CANCELLED`：表示取消状态，就是说我不要这个锁了，请你把我从队列中移出去。
- `SINGAL`：表示**当前节点的后继节点**正在等待，注意是后继节点，不是当前节点。

### AQS两套模式
AQS的模板方法有：
![](Pasted-image-20230203143651.png)
主要分三类：
- 独占式获取与释放同步状态
- 共享式获取与释放同步状态
- 查询同步队列中的等待线程情况

独占Exclusive（排它锁模式）和共享 Share（共享锁模式）就是 AQS 提供的两种模式。事实上，在 AQS 的所有子类中，只会使用这两种模式的其中之一，要么实现并使用了独占锁的 API，要么使用了共享锁的 API，**不会一个子类同时使用两套不同的模式。**
独占锁与共享锁在创建自己的节点时（`addWaiter` 方法）会通过 `nextWaiter` 变量来表明身份。

#### 独占模式
##### 锁获取
独占锁就是在同一时刻只能有一个线程获取到锁。
```java
public final void acquire(int arg) {
    if (!tryAcquire(arg) && // 此方法会尝试去获取锁
        // 将当前线程加入 CLH 队列中，这里可见添加了独占节点
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg)) 
        selfInterrupt();
}
```

{% note primary %}
tryAcquire是开放给子类重写的，所以子类可以自定义这个方法是否实现公平竞争。即共享/排他是AQS内部实现的，公平/非公平是子类实现的。
{% endnote %}

acquireQueued方法：
```java
final boolean acquireQueued(final Node node, int arg) {
    boolean failed = true;
    try {
        boolean interrupted = false;
        for (;;) {
            // 当前节点的前驱节点
            final Node p = node.predecessor();
            // 如果当前节点的前驱节点是头节点并且成功获取锁，则当前线程获取到独占锁
            if (p == head && tryAcquire(arg)) {
                setHead(node);
                p.next = null; // help GC
                failed = false;
                return interrupted;
            }
            // 获取独占锁失败，则当前线程进入等待态
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                interrupted = true;
        }
    } finally {
        if (failed)
            cancelAcquire(node);
    }
}
```

注意三点：
1)`if (p == head && tryAcquire(arg))`
如果当前节点的前驱节点是**头节点**并且成功获取锁，则当前线程获取到独占锁。
此时当前节点被称为**首节点**（与头节点做区分）。

2）`for(;;)`
会通过死循环（**自旋**）获取锁，如果失败了就阻塞该线程，直到被唤醒。

3）`setHead(node)`
将当前节点作为头节点

{% note danger %}
重点解释一下，如果某个线程节点是**头节点**，意味着该线程可能
1.持有锁
2.之前持有锁，但已经释放了（该节点此时是空节点）

释放节点的时候，并不会像链表一样由头节点线程操作链表将自己弹出，而是释放锁（state = 0），然后唤醒后继节点，后继节点发现自己已经是头节点的后继节点，且成功的获取同步（state = 1），则将之前的头节点弹出，自己做新的头节点。
{% endnote %}

![](Pasted-image-20230203144926.png)

{% note primary %}
1. 先看能否直接获取同步状态，有则直接获取return
2. 若不能，则说明其他线程持有锁
3. 在通过CAS添加节点的时候，再对前驱节点做一次判断，因为此时锁可能已经被释放，若前驱节点为头节点，则尝试获取同步状态，成功则return
4. 若前驱节点不是头节点，或前驱节点是头节点，但同步状态获取失败，则线程进入等待状态park(waitStatus变成)。
{% endnote %}

##### 锁释放
```java
public final boolean release(int arg) {
    if (tryRelease(arg)) {
        Node h = head;
        if (h != null && h.waitStatus != 0)
            unparkSuccessor(h);
        return true;
    }
    return false;
}
```
`unparkSuccessor`用于CAS操作唤醒头节点的后继节点：
- 改变头节点的waitStatus
- 校验后续节点的waitStatus查看是否已经放弃
- 若通过了则唤醒后继节点

##### 小结
- 在获取同步状态（锁）时，AQS 维护一个 CLH 双向队列，获取锁失败的线程都会通过 CAS 操作被加入到队列尾端，并且在队列中**无限自旋等待获取锁**；
- 停止自旋（或者说被移除 CLH 队列）的条件是其**前驱节点为头节点并且成功获取了独占锁**；
- 当前节点（线程）成功释放掉独占锁后，AQS 就会紧接着**唤醒该节点的后继节点**，这样，这个后继节点又会开始去尝试获取锁。循此往复。

#### 共享模式
##### 锁获取
```java
public final void acquireShared(int arg) {
    if (tryAcquireShared(arg) < 0)
        doAcquireShared(arg);
}
```
获取失败则执行`doAcquireShared`方法。
```java
private void doAcquireShared(int arg) {
    final Node node = addWaiter(Node.SHARED);
    boolean failed = true;
    try {
        boolean interrupted = false;
        for (;;) {
            final Node p = node.predecessor();
            if (p == head) {
                int r = tryAcquireShared(arg);
                if (r >= 0) {
                    setHeadAndPropagate(node, r);
                    p.next = null; // help GC
                    if (interrupted)
                        selfInterrupt();
                    failed = false;
                    return;
                }
            }
            if (shouldParkAfterFailedAcquire(p, node) &&
                parkAndCheckInterrupt())
                interrupted = true;
        }
    } finally {
        if (failed)
            cancelAcquire(node);
    }
}
```
同样会无限自旋直到获取锁：
- 头节点的后继节点
- 成功获取锁，即拿到需要的资源量arg

`setHeadAndPropagate`：自己拿到资源后，如果条件满足还会唤醒后继节点，因为这里是共享模式。

##### 锁释放
```java
public final boolean releaseShared(int arg) {
    if (tryReleaseShared(arg)) {
        doReleaseShared();
        return true;
    }
    return false;
}
```

`doReleaseShared` 如下：

```java
private void doReleaseShared() {
    for (;;) {
        Node h = head;
        if (h != null && h != tail) {
            int ws = h.waitStatus;
            if (ws == Node.SIGNAL) {
                if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))
                    continue;            // loop to recheck cases
                unparkSuccessor(h);
            }
            else if (ws == 0 &&
                     !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                continue;                // loop on failed CAS
        }
        if (h == head)                   // loop if head changed
            break;
    }
}
```

独占锁的释放直接就调用了 unparkSuccessor 方法唤醒后继节点，而共享锁这里，在 unparkSuccessor 之前还加了一个循环和 CAS 的操作来确保共享锁成功释放，因为可能同时存在多个线程释放锁（共享）。

##### 总结
共享锁与排他锁方法的区别：
这里的共享模式不同于读写锁，而是一种资源限制策略，一次只允许若干线程获取锁资源，前面的线程在释放锁之后，后面的线程就可以使用该线程释放的资源。
>- tryAcquire(int)：独占方式。尝试获取资源，成功则返回true，失败则返回false。
>- tryRelease(int)：独占方式。尝试释放资源，成功则返回true，失败则返回false。
>- tryAcquireShared(int)：共享方式。尝试获取资源。负数表示失败；0表示成功，但没有剩余可用资源；正数表示成功，且有剩余资源。
>- tryReleaseShared(int)：共享方式。尝试释放资源，如果释放后允许唤醒后续等待结点返回true，否则返回false。

## ReentrantLock
**重入锁**，是Lock接口的实现，聚合了AQS。

### 重入锁原理
#### 锁获取
对于公平锁和非公平锁来说，它们获取锁的方式是不同的。

>ReentrantLock 的 tryLock 方法调用的也就是非公平锁的方法，也就是说，即使该锁是公平锁，使用 tryLock() 方法的话也会使用非公平的方式去获取锁。

这里以获取非公平锁为例：
![](Pasted-image-20230203163610.png)
该方法只定义如何获取锁，失败后策略在AQS中已经实现：
- 若锁不被占有则获取return true
- 若被占有则检查持有者是否为本线程，是则获取+1，return true
- 否则return false

#### 锁释放
通过CAS令state--，如果state = 0，则释放锁。

### 公平锁与非公平锁
红线表示内部类，蓝线表示继承，绿色虚线表示实现接口：
![](Pasted-image-20230203164710.png)
ReentrantLock 的无参构造使用的就是非公平锁：
![](Pasted-image-20230203164756.png)
当然也可以传入一个 boolean 值，true 时为公平锁，false 时为非公平锁：
![](Pasted-image-20230203164805.png)
重写方法：
![](Pasted-image-20230203164823.png)
都只重写了加锁方法，公平锁和非公平锁的释放方法相同。

调用链：
ReentrantLock.lock -> Sync.lock -> NonfairSync/FairSync.lock -> AQS.acquire -> NonfairSync/FairSync.tryAcquire()
- lock是根据具体实现决定执行方式
- tryLock永远通过非公平方式，所以其实现放在了Sync中

#### 底层区别
公平锁的 `tryAcquire` 方法：
![](Pasted-image-20230203165544.png)
公平锁多了hasQueuedPredecessors，快速判断当前节点是否有前驱节点。
- 公平锁：先判断队列，再尝试CAS操作state
- 非公平锁：先CAS，失败再看队列，对于非公平锁，可能存在一个线程刚被唤醒与另一个外部线程同时尝试CAS。

#### 对比
非公平锁的效率最高，所以`tryLock`的默认实现是非公平的。

## ReentrantReadWriteLock
读写锁中的读锁和写锁也都是**可重入**的。通过分离读锁和写锁，使得读写锁的并发性能相比一般的排他锁有了很大提升。

### ReadWriteLock接口
![](Pasted-image-20230203170043.png)
这个接口只有两个方法，`readLock` 用来获取读锁，`writeLock` 用来获取写锁。
#### 实现
- ReentrantReadWriteLock
- StampedLock，是对前者的增强

### ReentrantReadWriteLock
![](Pasted-image-20230203170223.png)
读写锁拥有读锁和写锁两个实体。

#### 基本使用
```java
public class Test {    
    static Map<String, Object> map = new HashMap<String, Object>();  
    // 读写锁
    static ReentrantReadWriteLock rwl = new ReentrantReadWriteLock();    
    // 读锁
    static Lock readLock = rwl.readLock();    
    // 写锁
    static Lock writeLock = rwl.writeLock();    
    // 获取一个 key 对应的 value    
    public static final Object get(String key) { 
        // 加读锁
        readLock.lock();            
        try {                    
            return map.get(key);            
        } finally {
            // 释放读锁
            readLock.unlock();            
        }    
    }    
    // 设置 key 对应的 value，并返回旧的 value    
    public static final Object put(String key, Object value) {    
        // 加写锁
        writeLock.lock();            
        try {                    
            return map.put(key, value);            
        } finally {
            // 释放写锁
            writeLock.unlock();            
        }    
    }    
}
```

>如果不使用读写锁，就需要使用java的等待通知机制（wait,notify）。使用读写锁比等待通知方式简单的多。

#### ReentrantWriteLock
使用一个state同时维护读、写状态，将 32 位的整型变量 state 切分成两个部分，高 16 位表示读，低 16 位表示写：
![](Pasted-image-20230203170539.png)
通过位运算即可获取、修改状态。

##### 写锁获取
- 如果当前有锁（state != 0）
	- 如果读锁（高16位）已经被获取过，则无法获取写锁。
	- 如果没有读锁（高16位），且写锁持有者是自己，则可以重入。
- 如果没锁
	- 尝试CAS获取

##### 读锁获取
- 如果当前线程持有写锁，可重入
- 如果当前线程没有写锁
	- 如果其他线程有写锁，失败
	- 如果其他线程没有写锁，查看本线程是否有读锁
		- 有则state++
		- 没有则CAS获取

**读状态是所有线程获取读锁次数的总和，而每个线程各自获取读锁的次数只能选择保存在 `ThreadLocal` 中，由每个线程自己来维护**，这使获取读锁的实现变得复杂。

##### 锁降级
读写锁中的锁降级指的是，**写锁降级成为读锁**。
把持住当前线程所拥有的写锁，然后获取到读锁，随后释放先前拥有的写锁。

主要应用在于：
某线程的加锁写操作对其后续的读操作必然是**可见**的，中间不会被其他线程修改。

## Condition接口
Lock中，通过Condition中实现等待通知功能。
lock有一个方法是`newCondition()`，其可以生成一个Condition对象并返回。

### 底层原理
`Condition`接口的实现类为`ConditionObject`，其存在于AQS内部。

Condition也是通过队列的方式实现阻塞和唤醒的，与AQS中的CLH不同在于，Condition队列叫做**等待队列**，CLH队列叫做**同步队列**。

Condition等待队列是一个FIFO的**单向队列**。
![](Pasted-image-20230203172742.png)

**一个 Lock 对象可以拥有一个同步队列和多个等待队列**：
![](Pasted-image-20230203172822.png)

### 方法
#### await
当前线程调用`Condition.await()` 方法，**将会以当前线程构造节点，并将节点从尾部加入等待队列。**

不同于 CLH 同步队列在尾部添加节点时需要使用 CAS 操作，**Condition 等待队列不需要 CAS 的保证**，因为调用 `await` 方法的线程必定是获取了 Lock的线程，不会有其他线程来争夺这个添加尾部节点的操作。
从逻辑上看，这与设置头节点不需要CAS相同。
从语义上看，这与`wait()`方法只在`synchronized`块中调用相同。

#### signal
**将 Condition 等待队列的首节点移动到 CLH 同步队列的尾部**
同样，`signal` 这个方法，一定是当前占据锁的线程调用的。
![](Pasted-image-20230203173352.png)

#### signalAll
将等待队列中所有节点全部移动到同步队列中。

