---
title: JVM下篇:性能监控与调优
categories:
 - [八股,Java,JVM]
date: 2023-02-02 13:57:22
tag:
 - JVM
 - 八股
---
# 一、概述
## 背景说明
**生产环境中的问题**
- 生产环境发生了内存溢出该如何处理？
- 生产环境应该给服务器分配多少内存合适？
- 如何对垃圾回收器的性能进行调优？
- 生产环境CPU负载飙高该如何处理？
- 生产环境应该给应用分配多少线程合适？
- 不加log，如何确定请求是否执行了某一行代码？
- 不加log，如何实时查看某个方法的入参与返回值？

**为什么要调优**
- 防止出现OOM
- 解决OOM
- 减少Full GC出现的频率

**不同阶段的考虑**
- 上线前
- 项目运行阶段
- 线上出现OOM
{% note primary %}
上面这些浏览一下，看个大概就行。
{% endnote %}

## 调优概述
**监控的依据**
- 运行日志
- 异常堆栈
- GC日志
- 线程快照
- 堆转储快照

**调优的大方向**
- 合理地编写代码
- 充分并合理的使用硬件资源
- 合理地进行JVM调优

**性能优化的步骤**
**第1步：性能监控**
- GC频繁
- cpu load过高
- OOM
- 内存泄露
- 死锁
- 程序响应时间较长

**第2步：性能分析**
- 打印GC日志来分析异常信息
- 灵活运用命令行工具、jstack、jmap、jinfo等
- dump出堆文件，使用内存分析工具分析文件
- 使用阿里Arthas、jconsole、JVisualVM来实时查看JVM状态
- jstack查看堆栈信息

**第3步：性能调优**
- 适当增加内存，根据业务背景选择垃圾回收器
- 优化代码，控制内存使用
- 增加机器，分散节点压合理设置线程池线程数量
- 使用中间件提高程序效率，比如缓存、消息队列等

**吞吐量**
- 对单位时间内完成的工作量（请求）的量度
- 在GC中：运行用户代码的事件占总运行时间的比例（总运行时间：程序的运行时间+内存回收的时间）
- 吞吐量为1-1/(1+n)，其中-XX::GCTimeRatio=n

**并发数**
- 同一时刻，对服务器有实际交互的请求数

**内存占用**
- Java堆区所占的内存大小

# 二、监控-命令行
- jps：查看正在运行的Java进程
- jstat：查看JVM统计信息
	- 跟随 -class查看类加载情况
	- 跟随 -compiler查看编译情况
	- 跟随 -gc查看垃圾回收情况
- jinfo：实时查看和修改JVM配置参数
- jmap：导出内存映像文件&内存使用情况（**dump文件**）
- jhat：JDK自带堆分析工具（已经删除）
- jstack：打印JVM中线程快照
- jcmd：多功能命令行（执行上面的命令）
- jstatd：远程主机信息收集

# 三、监控-GUI
- JConsole，java自带
- Visual VM，java自带
- Eclipse MAT，堆分析器，分析dump文件
- JProfiler，好用全面，但收费
- Arthas，阿里开源，远程监控
- Java Misssion Control，Oracle JDK中提供，官方出品，使用采样技术，开销很小
	- Java Flight Record，JMC的组件

# 四、JVM运行时参数
## JVM参数选项
### 类型一：标准参数选项
java -help出的内容，一般为常规参数

#### Server模式与Client模式
Hotspot JVM有两种模式，分别是server和client，分别通过-server和-client模式设置。
- **32位系统**上，默认使用Client类型的JVM。要想使用Server模式，机器配置至少有2个以上的CPU和2G以上的物理内存。**client模式适用于对内存要求较小的桌面应用程序，默认使用Serial串行垃圾收集器**。
- **64位系统**上，**只支持server模式的JVM**，适用于需要大内存的应用程序，**默认使用并行垃圾收集器**。

### 类型二：-X参数选项
java -X 出的内容，相当于一些高级选项
熟悉的有：
```shell
-Xms<size>        设置初始 Java 堆大小
-Xmx<size>        设置最大 Java 堆大小
-Xss<size>        设置 Java 线程堆栈大小
```

### 类型三：-XX参数选项
```shell
-XX:+<option>  启用option属性
-XX:-<option>  禁用option属性

-XX:<option>=<number>  设置option数值，可以带单位如k/K/m/M/g/G
-XX:<option>=<string>  设置option字符值
```
一些开关类，设置类

## 常用的JVM选项
### 打印XX选项
```shell
-XX:+PrintCommandLineFlags 程序运行时JVM默认设置或用户手动设置的XX选项
-XX:+PrintFlagsInitial 打印所有XX选项的默认值
-XX:+PrintFlagsFinal 打印所有XX选项的实际值
-XX:+PrintVMOptions 打印JVM的参数
```

### 内存大小设置
```shell
# 栈
-Xss128k <==> -XX:ThreadStackSize=128k 设置线程栈的大小为128K

# 堆
-Xms2048m <==> -XX:InitialHeapSize=2048m 设置JVM初始堆内存为2048M
-Xmx2048m <==> -XX:MaxHeapSize=2048m 设置JVM最大堆内存为2048M
-Xmn2g <==> -XX:NewSize=2g -XX:MaxNewSize=2g 设置年轻代大小为2G
-XX:SurvivorRatio=8 设置Eden区与Survivor区的比值，默认为8
-XX:NewRatio=2 设置老年代与年轻代的比例，默认为2
-XX:+UseAdaptiveSizePolicy 设置大小比例自适应，默认开启
-XX:PretenureSizeThreadshold=1024 设置让大于此阈值的对象直接分配在老年代，只对Serial、ParNew收集器有效
-XX:MaxTenuringThreshold=15 设置新生代晋升老年代的年龄限制，默认为15
-XX:TargetSurvivorRatio 设置MinorGC结束后Survivor区占用空间的期望比例

# 方法区
-XX:MetaspaceSize / -XX:PermSize=256m 设置元空间/永久代初始值为256M
-XX:MaxMetaspaceSize / -XX:MaxPermSize=256m 设置元空间/永久代最大值为256M
-XX:+UseCompressedOops 使用压缩对象
-XX:+UseCompressedClassPointers 使用压缩类指针
-XX:CompressedClassSpaceSize 设置Klass Metaspace的大小，默认1G

# 直接内存
-XX:MaxDirectMemorySize 指定DirectMemory容量，默认等于Java堆最大值
```

{% note primary %}
可见对内存使用的配置基本都是使用`-XX：`形式，其中设置堆、栈大小给出了`-X`的形式。
{% endnote %}

### OutOfMemory相关的选项
```shell
-XX:+HeapDumpOnOutMemoryError 内存出现OOM时生成Heap转储文件，两者互斥
-XX:+HeapDumpBeforeFullGC 出现FullGC时生成Heap转储文件，两者互斥
-XX:HeapDumpPath=<path> 指定heap转储文件的存储路径，默认当前目录
-XX:OnOutOfMemoryError=<path> 指定可行性程序或脚本的路径，当发生OOM时执行脚本
```

### 垃圾收集器
```shell
# Serial回收器
-XX:+UseSerialGC  年轻代使用Serial GC， 老年代使用Serial Old GC
# ParNew回收器
-XX:+UseParNewGC  年轻代使用ParNew GC
-XX:ParallelGCThreads  设置年轻代并行收集器的线程数。
	一般地，最好与CPU数量相等，以避免过多的线程数影响垃圾收集性能。


# Parallel回收器
-XX:+UseParallelGC  年轻代使用 Parallel Scavenge GC，互相激活
-XX:+UseParallelOldGC  老年代使用 Parallel Old GC，互相激活
-XX:ParallelGCThreads
-XX:MaxGCPauseMillis  设置垃圾收集器最大停顿时间（即STW的时间），单位是毫秒。
	为了尽可能地把停顿时间控制在MaxGCPauseMills以内，收集器在工作时会调整Java堆大小或者其他一些参数。
	对于用户来讲，停顿时间越短体验越好；但是服务器端注重高并发，整体的吞吐量。
	所以服务器端适合Parallel，进行控制。该参数使用需谨慎。
-XX:GCTimeRatio  垃圾收集时间占总时间的比例（1 / (N＋1)），用于衡量吞吐量的大小
	取值范围（0,100），默认值99，也就是垃圾回收时间不超过1％。
	与前一个-XX：MaxGCPauseMillis参数有一定矛盾性。暂停时间越长，Radio参数就容易超过设定的比例。
-XX:+UseAdaptiveSizePolicy  设置Parallel Scavenge收集器具有自适应调节策略。
	在这种模式下，年轻代的大小、Eden和Survivor的比例、晋升老年代的对象年龄等参数会被自动调整，以达到在堆大小、吞吐量和停顿时间之间的平衡点。
	在手动调优比较困难的场合，可以直接使用这种自适应的方式，仅指定虚拟机的最大堆、目标的吞吐量（GCTimeRatio）和停顿时间（MaxGCPauseMills），让虚拟机自己完成调优工作。


# CMS回收器
-XX:+UseConcMarkSweepGC  年轻代使用CMS GC。
	开启该参数后会自动将-XX：＋UseParNewGC打开。即：ParNew（Young区）+ CMS（Old区）+ Serial Old的组合
-XX:CMSInitiatingOccupanyFraction  设置堆内存使用率的阈值，一旦达到该阈值，便开始进行回收。JDK5及以前版本的默认值为68，DK6及以上版本默认值为92％。
	如果内存增长缓慢，则可以设置一个稍大的值，大的阈值可以有效降低CMS的触发频率，减少老年代回收的次数可以较为明显地改善应用程序性能。
	反之，如果应用程序内存使用率增长很快，则应该降低这个阈值，以避免频繁触发老年代串行收集器。
	因此通过该选项便可以有效降低Fu1l GC的执行次数。
-XX:+UseCMSInitiatingOccupancyOnly  是否动态可调，使CMS一直按CMSInitiatingOccupancyFraction设定的值启动
-XX:+UseCMSCompactAtFullCollection  用于指定在执行完Full GC后对内存空间进行压缩整理
	以此避免内存碎片的产生。不过由于内存压缩整理过程无法并发执行，所带来的问题就是停顿时间变得更长了。
-XX:CMSFullGCsBeforeCompaction  设置在执行多少次Full GC后对内存空间进行压缩整理。
-XX:ParallelCMSThreads  设置CMS的线程数量。
	CMS 默认启动的线程数是(ParallelGCThreads＋3)/4，ParallelGCThreads 是年轻代并行收集器的线程数。
	当CPU 资源比较紧张时，受到CMS收集器线程的影响，应用程序的性能在垃圾回收阶段可能会非常糟糕。
-XX:ConcGCThreads  设置并发垃圾收集的线程数，默认该值是基于ParallelGCThreads计算出来的
-XX:+CMSScavengeBeforeRemark  强制hotspot在cms remark阶段之前做一次minor gc，用于提高remark阶段的速度
-XX:+CMSClassUnloadingEnable  如果有的话，启用回收Perm 区（JDK8之前）
-XX:+CMSParallelInitialEnabled  用于开启CMS initial-mark阶段采用多线程的方式进行标记
	用于提高标记速度，在Java8开始已经默认开启
-XX:+CMSParallelRemarkEnabled  用户开启CMS remark阶段采用多线程的方式进行重新标记，默认开启
-XX:+ExplicitGCInvokesConcurrent
-XX:+ExplicitGCInvokesConcurrentAndUnloadsClasses
	这两个参数用户指定hotspot虚拟在执行System.gc()时使用CMS周期
-XX:+CMSPrecleaningEnabled  指定CMS是否需要进行Pre cleaning阶段


# G1回收器
-XX:+UseG1GC 手动指定使用G1收集器执行内存回收任务。
-XX:G1HeapRegionSize 设置每个Region的大小。
	值是2的幂，范围是1MB到32MB之间，目标是根据最小的Java堆大小划分出约2048个区域。默认是堆内存的1/2000。
-XX:MaxGCPauseMillis  设置期望达到的最大GC停顿时间指标（JVM会尽力实现，但不保证达到）。默认值是200ms
-XX:ParallelGCThread  设置STW时GC线程数的值。最多设置为8
-XX:ConcGCThreads  设置并发标记的线程数。将n设置为并行垃圾回收线程数（ParallelGCThreads）的1/4左右。
-XX:InitiatingHeapOccupancyPercent 设置触发并发GC周期的Java堆占用率阈值。超过此值，就触发GC。默认值是45。
-XX:G1NewSizePercent  新生代占用整个堆内存的最小百分比（默认5％）
-XX:G1MaxNewSizePercent  新生代占用整个堆内存的最大百分比（默认60％）
-XX:G1ReservePercent=10  保留内存区域，防止 to space（Survivor中的to区）溢出
```
#### 垃圾回收器选择
- 优先让JVM自适应，调整堆的大小
- **串行**收集器：内存小于100M；**单核、单机程序**，并且没有停顿时间的要求
- **并行**收集器：**多CPU、高吞吐量**、允许停顿时间超过1秒
- **并发**收集器：多CPU、追求低停顿时间、**快速响应**（比如延迟不能超过1秒，如互联网应用）
- **官方推荐G1**，性能高。现在互联网的项目，基本都是使用G1。

# 五、GC相关日志
```shell
-XX:+PrintGC <==> -verbose:gc  打印简要日志信息
-XX:+PrintGCDetails            打印详细日志信息
-XX:+PrintGCTimeStamps  打印程序启动到GC发生的时间，搭配-XX:+PrintGCDetails使用
-XX:+PrintGCDateStamps  打印GC发生时的时间戳，搭配-XX:+PrintGCDetails使用
-XX:+PrintHeapAtGC  打印GC前后的堆信息，如下图
-Xloggc:<file> 输出GC导指定路径下的文件中

-XX:+TraceClassLoading  监控类的加载
-XX:+PrintGCApplicationStoppedTime  打印GC时线程的停顿时间
-XX:+PrintGCApplicationConcurrentTime  打印垃圾收集之前应用未中断的执行时间
-XX:+PrintReferenceGC 打印回收了多少种不同引用类型的引用
-XX:+PrintTenuringDistribution  打印JVM在每次MinorGC后当前使用的Survivor中对象的年龄分布
-XX:+UseGCLogFileRotation 启用GC日志文件的自动转储
-XX:NumberOfGCLogFiles=1  设置GC日志文件的循环数目
-XX:GCLogFileSize=1M  设置GC日志文件的大小
```

## 其他参数
```shell
-XX:+DisableExplicitGC  禁用hotspot执行System.gc()，默认禁用
-XX:ReservedCodeCacheSize=<n>[g|m|k]、-XX:InitialCodeCacheSize=<n>[g|m|k]  指定代码缓存的大小
-XX:+UseCodeCacheFlushing  放弃一些被编译的代码，避免代码缓存被占满时JVM切换到interpreted-only的情况
-XX:+DoEscapeAnalysis  开启逃逸分析
-XX:+UseBiasedLocking  开启偏向锁
-XX:+UseLargePages  开启使用大页面
-XX:+PrintTLAB  打印TLAB的使用情况
-XX:TLABSize  设置TLAB大小
```

## Java获取运行参数
Java提供了`java.lang.management`包用于监视和管理Java虚拟机和Java运行时中的其他组件，它允许本地或远程监控和管理运行的Java虚拟机。
其中**ManagementFactory**类较为常用，另外**Runtime**类可获取内存、CPU核数等相关的数据。通过使用这些api，可以监控应用服务器的堆内存使用情况，设置一些阈值进行报警等处理。
```java
public class MemoryMonitor {
    public static void main(String[] args) {
        MemoryMXBean memorymbean = ManagementFactory.getMemoryMXBean();
        MemoryUsage usage = memorymbean.getHeapMemoryUsage();
        System.out.println("INIT HEAP: " + usage.getInit() / 1024 / 1024 + "m");
        System.out.println("MAX HEAP: " + usage.getMax() / 1024 / 1024 + "m");
        System.out.println("USE HEAP: " + usage.getUsed() / 1024 / 1024 + "m");
        System.out.println("\nFull Information:");
        System.out.println("Heap Memory Usage: " + memorymbean.getHeapMemoryUsage());
        System.out.println("Non-Heap Memory Usage: " + memorymbean.getNonHeapMemoryUsage());

        System.out.println("=======================通过java来获取相关系统状态============================ ");
        System.out.println("当前堆内存大小totalMemory " + (int) Runtime.getRuntime().totalMemory() / 1024 / 1024 + "m");// 当前堆内存大小
        System.out.println("空闲堆内存大小freeMemory " + (int) Runtime.getRuntime().freeMemory() / 1024 / 1024 + "m");// 空闲堆内存大小
        System.out.println("最大可用总堆内存maxMemory " + Runtime.getRuntime().maxMemory() / 1024 / 1024 + "m");// 最大可用总堆内存大小
    }
}
```

## 分析GC日志
### 分类
- 部分收集（Partial GC）：不是完整收集整个Java堆的垃圾收集。其中又分为：
	- 新生代收集（Minor GC / Young GC）：只是新生代（Eden / S0, S1）的垃圾收集
	- 老年代收集（Major GC / Old GC）：只是老年代的垃圾收集。目前，只有CMS GC会有单独收集老年代的行为。注意，很多时候Major GC会和Full GC混淆使用，需要具体分辨是老年代回收还是整堆回收。
- 混合收集（Mixed GC）：收集整个新生代以及部分老年代的垃圾收集。目前，只有G1 GC会有这种行为
- 整堆收集（Full GC）：收集整个java堆和方法区的垃圾收集。

### 日志结构
```java
[GC (Allocation Failure) [PSYoungGen: 31744K->2192K (36864K) ] 31744K->2200K (121856K), 0.0139308 secs] [Times: user=0.05 sys=0.01, real=0.01 secs]
```

**GC原因**
- Allocation Failure：表明本次引起GC的原因是因为新生代中没有足够的区域存放需要分配的数据
- Metadata GCThreshold：Metaspace区不够用了
- FErgonomics：JVM自适应调整导致的GC
- System：调用了System.gc()方法

**垃圾收集器**
- Serial收集器：新生代显示 `"[DefNew"`，即 Default New Generation
- ParNew收集器：新生代显示 `"[ParNew"`，即 Parallel New Generation
- Parallel Scavenge收集器：新生代显示`"[PSYoungGen"`，JDK1.7使用的即PSYoungGen
- Parallel Old收集器：老年代显示`"[ParoldGen"`
- G1收集器：显示`"garbage-first heap"`

**GC前后**
形式：GC前内存占用-＞GC后内存占用（该区域内存总大小）
- 中括号内：GC回收前年轻代堆大小，回收后大小，（年轻代堆总大小）
- 括号外：GC回收前年轻代和老年代大小，回收后大小，（年轻代和老年代总大小）

**GC时间**
- user：进程执行用户态代码（核心之外）所使用的时间。这是执行此进程所使用的实际CPU时间，其他进程和此进程阻塞的时间并不包括在内。在垃圾收集的情况下，表示GC线程执行所使用的CPU总时间。
- sys：进程在内核态消耗的 CPU 时间，即在内核执行系统调用或等待系统事件所使用的CPU 时间
- real：程序从开始到结束所用的时钟时间。这个时间包括其他进程使用的时间片和进程阻塞的时间（比如等待 I/O 完成）。对于并行gc，这个数字应该接近（用户时间＋系统时间）除以垃圾收集器使用的线程数。

由于多核，一般而言：real time < sys time＋user time
如果real＞sys＋user的话，则可能存在下列问题：IO负载非常重或CPU不够用。

# 六、浅堆深堆与内存泄漏
## 概念补充
### 浅堆（Shallow Heap）
**浅堆是指一个对象所消耗的内存**。
在32位系统中，一个对象引用会占据4个字节，一个int类型会占据4个字节，long型变量会占据8个字节，每个对象头需要占用8个字节。根据堆快照格式不同，对象的大小可能会同8字节进行对齐。

### 保留集（Retained Set）
对象A的保留集指当对象A被垃圾回收后，可以被释放的所有的对象集合（包括对象A本身），即对象A的保留集可以被认为是只能通过对象A被直接或间接访问到的所有对象的集合。
通俗地说，就是指**仅被对象A所持有的对象的集合，包括A自身**。

### 深堆（Retained Heap）
深堆是指对象的保留集中所有的对象的浅堆大小之和。

注意：浅堆指对象本身占用的内存，不包括其内部引用对象的大小。一个对象的深堆指只能通过该对象访问到的（直接或间接）所有对象的浅堆之和，即对象被回收后，可以释放的真实空间。

### 对象的实际大小
这里，对象的实际大小定义为一个对象所能触及的所有对象的浅堆大小之和，也就是通常意义上我们说的对象大小。与深堆相比，似乎这个在日常开发中更为直观和被人接受，**但实际上，这个概念和垃圾回收无关**。

{% note primary %}
浅堆：对象本身的大小
深堆：对象及其**独有**所有直接，间接引用的大小
对象大小：对象及其所有直接，间接引用的大小
{% endnote %}

### 支配树（Dominator Tree）
支配树的概念源自图论。体现对象实例之间的支配关系：
- 如果指向B的所有路径都经过A，则认为A是B的**支配者**。
- 如果A是离B最近的支配者，则A是B的**直接支配者**。

### 内存泄漏（memory leak）
严格上说：对象不会再被程序用到了，但是GC又不能回收他们的情况（永生），才叫内存泄漏。
宽泛的说：由于对象的生命周期过长（存活过久，如某对象不再使用，但其支配者仍需要存活一段时间的情况）。

### 内存溢出（OOM）
内存泄漏的增多，最终会导致内存溢出。

## Java中内存泄漏的8种情况
- 静态集合类（方法区）
- 单例模式（方法区）
- 内部类持有外部类（一个内部类总是保存着外部类的引用）
- 数据库，IO连接等（没有关闭连接，无法回收）
- 不合理的作用域（变量作用范围大于其使用范围）
- 改变哈希值
	- 当一个对象被存储进HashSet集合中以后，就不能修改这个对象中的那些参与计算哈希值的字段了。否则再也无法检索到该对象
- 缓存泄漏（可以使用WeakHashMap）
- 监听器和其他回调
	- 回调函数：一个通过**函数指针**调用的函数。如果你把函数的**指针地址**作为**参数传递**给另一个函数，当这个指针被用来调用其所指向的函数时，我们就说这是回调函数。
	- 如果客户端向应用注册了一个回调函数，使用后没有取消，则会造成内存泄漏，解决办法是使用WeakHashMap。

