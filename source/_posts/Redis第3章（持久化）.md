---
title: Redis第3章（持久化）
categories:
 - [八股,Redis,基础]
date: 2023-01-03 21:04:40
tag:
 - Redis
 - 八股
---
## 持久化：RDB和AOF机制详解
### RDB(*Redis DataBase*)持久化
#### 触发方式
>**手动触发** 和 **自动触发**

##### 手动触发
- `save`命令：由主线程执行，会造成长时间阻塞。
- `bgsave`命令：fork子线程执行，阻塞只发生在fork阶段。

![](Pasted-image-20230103211303.png)

具体流程如下：
- redis客户端执行bgsave命令或者自动触发bgsave命令；
- 主进程判断当前是否已经存在正在执行的子进程，如果存在，**那么主进程直接返回**；
- 如果不存在正在执行的子进程，那么就fork一个新的子进程进行持久化数据，fork过程是阻塞的，fork操作完成后主进程即可执行其他操作；
- 子进程先将数据写入到临时的rdb文件中，待快照数据写入完成后再原子**替换**旧的rdb文件；
- 同时发送信号给主进程，通知主进程rdb持久化完成，主进程更新相关的统计信息（info Persitence下的rdb_相关选项）。

##### 自动触发
由以下4种触发情况
- 定时触发：`save m n`，m秒有n条发生变化
- 主从复制
- 执行debug reload重新加载redis，bgsave操作
- shutdown命令

**相关配置**
`stop-writes-on-bgsave-error`：bgsave错误时暂停主线程，主要目的是让运维人员排查问题
`rdbcompression`：启用LZF压缩算法
`rdbchecksum`：64位CRC冗余校验编码，可以验证RDB的完整性。

#### 深入RDB
- **并发问题？**
[Copy-on-Write](https://zhuanlan.zhihu.com/p/339437815#:~:text=%20Redis%E4%B8%AD%E6%89%A7%E8%A1%8CBGSAVE%E5%91%BD%E4%BB%A4%E7%94%9F%E6%88%90RDB%E6%96%87%E4%BB%B6%E6%97%B6%EF%BC%8C%E6%9C%AC%E8%B4%A8%E5%B0%B1%E6%98%AF%E8%B0%83%E7%94%A8Linux%E4%B8%AD%E7%9A%84fork%20%28%29%E5%91%BD%E4%BB%A4%EF%BC%8CLinux%E4%B8%8B%E7%9A%84fork,%28%29%E7%B3%BB%E7%BB%9F%E8%B0%83%E7%94%A8%E5%AE%9E%E7%8E%B0%E4%BA%86copy-on-write%E5%86%99%E6%97%B6%E5%A4%8D%E5%88%B6%EF%BC%9B%20fork%20%28%29%E4%B9%8B%E5%90%8E%EF%BC%8Ckernel%E6%8A%8A%E7%88%B6%E8%BF%9B%E7%A8%8B%E4%B8%AD%E6%89%80%E6%9C%89%E7%9A%84%E5%86%85%E5%AD%98%E9%A1%B5%E7%9A%84%E6%9D%83%E9%99%90%E9%83%BD%E8%AE%BE%E4%B8%BAread-only%EF%BC%8C%E7%84%B6%E5%90%8E%E5%AD%90%E8%BF%9B%E7%A8%8B%E7%9A%84%E5%9C%B0%E5%9D%80%E7%A9%BA%E9%97%B4%E6%8C%87%E5%90%91%E7%88%B6%E8%BF%9B%E7%A8%8B%E3%80%82%20%E5%BD%93%E7%88%B6%E5%AD%90%E8%BF%9B%E7%A8%8B%E9%83%BD%E5%8F%AA%E8%AF%BB%E5%86%85%E5%AD%98%E6%97%B6%EF%BC%8C%E7%9B%B8%E5%AE%89%E6%97%A0%E4%BA%8B%E3%80%82)
![](Pasted-image-20230103215527.jpg)
如果主线程需要进行写操作，则将写操作部分的数据块复制，对新的副本进行修改，这样保证了bgsave子进程可见的数据的一致性（即bgsave开始时的快照）

- **若服务崩溃怎么办？**
bgsave的temp文件在生成之前不会覆盖旧的dump。
- **能否尽可能快的RDB**?
快照过快会导致fork大量阻塞主线程，且磁盘空间是有限的。

### 优缺点
- 优点
	- **LZF压缩算法，文件体积远小于内存**
	- 加载速度比AOF快
- 缺点
	- **实时性不够**
	- **开销大**
	- 版本兼容
	- RDB文件无法手动修改

### AOF(*append only file*)持久化

执行写命令时，**先写内存，后写日志**。
![](Pasted-image-20230103220350.jpg)
>目的：
>1. 避免额外检查，执行成功才写日志
>2. 不阻塞当前写操作
>风险：
>1. 完成写内存后中断，日志缺失
>2. 主线程写磁盘压力过大

#### 实现
- **命令追加** 当AOF持久化功能打开了，服务器在执行完一个写命令之后，会以协议格式将被执行的写命令追加到服务器的 aof_buf 缓冲区。
- **文件写入和同步** 关于何时将 aof_buf 缓冲区的内容写入AOF文件中，Redis提供了三种写回策略：
![](Pasted-image-20230103220620.jpg)
- **AOF重写** Redis通过创建一个新的AOF文件来替换现有的AOF。

{% note primary %}
aof_buf缓存写命令，触发写回时将aof_buf中命令一次写入磁盘
{% endnote %}

**相关配置**
`appendfsync`：主要用于设置“真正执行”操作命令向AOF文件中同步的策略，支持always、everysec、no，默认为everysec。
`no-appendfsync-on-rewrite`：**重写**时不再记录新命令
`auto-aof-rewrite-percentage`：当前AOF文件超过上次重写AOF文件大小的百分之多少后开始重写。
`auto-aof-rewrite-min-size`：当前AOF文件超过设置大小时开始重写

#### 深入AOF重写
- **AOF重写会阻塞吗**？
重写时会fork主线程，由后台进程bgrewriteaof完成，fork时会阻塞主线程。
- **何时重写**？
auto-aof-rewrite-percentage和auto-aof-rewrite-min-size
- **并发问题**？
![](Pasted-image-20230103221653.jpg)
重写时:
- redis原始数据会通过copy on write机制拷贝
- 服务器写入新数据时，会将新数据同时写入两个aof_buf缓存区（当持久化策略为always时，则是写入磁盘和一个aof_buf缓冲），**子线程**完成重写后通知主线程，**主线程**会把aof重写缓冲区的命令追加到aof文件中。最后文件改名，保证原子性。

>fork采用操作系统提供的写时复制（copy on write）机制，就是为了避免一次性拷贝大量内存数据给子进程造成阻塞。fork子进程时，子进程时会**拷贝父进程的页表**，即**虚实映射关系**（虚拟内存和物理内存的映射索引表），而**不会拷贝物理内存**。这个拷贝会消耗大量cpu资源，并且**拷贝完成前会阻塞主线程**，阻塞时间取决于内存中的数据量，数据量越大，则内存页表越大。拷贝完成后，父子进程使用相同的内存地址空间。

- **重写时有哪些阻塞**？
	- fork
	- 主线程bigkey写入，操作系统需要创建页面副本并拷贝原有数据。
	- 主线程追加写入aof

- **为什么AOF不复用原AOF文件**？
	- 父子同时写一个文件产生竞争，影响父进程性能
	- 若重写失败会造成污染

### RDB和AOF混合方式
在Redis4.0提出，简单来说，内存快照以一定的频率执行，在两次快照之间，使用AOF日志**记录这期间**的所有命令操作。
![](Pasted-image-20230103222843.jpg)
- RDB不用过快执行，同时AOF也不会过大

### 持久化恢复
重启redis即可恢复
![](Pasted-image-20230103222858.png)
AOF优先级更高，因为其数据更完整。