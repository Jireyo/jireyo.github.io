---
title: Redis第1章（数据类型与结构）
categories:
 - [八股,Redis,基础]
date: 2022-12-30 19:08:50
tag:
 - Redis
 - 八股
---

# 一、Redis知识体系
![](Pastedimage20221230191017.png)

# 二、Redis概念与基础
## Redis特点
- 读写性能优异：Redis能读的速度是110000次/s,写的速度是81000次/s。
- 数据类型丰富：Redis支持二进制案例的 Strings, Lists, Hashes, Sets 及 Ordered Sets 数据类型操作。
- 原子性：Redis的所有操作都是原子性的，同时Redis还支持对几个操作全并后的原子性执行。
- 持久化：AOF/RDB
- 发布订阅：Subscribe
- 分布式：RedisCluster
- redis为每个服务提供有16个数据库，编号从0到15，默认为0号数据库

## Redis使用场景
- 热点数据的缓存
- 限时任务的运用
- 计数器
- 分布式锁
- 延时操作
- 排行榜
- 点赞

# 三、Redis基础数据类型
>Redis所有的key（键）都是字符串。我们在谈基础数据结构时，讨论的是存储值的数据类型，主要包括常见的5种数据类型，分别是：String、List、Set、Zset、Hash

![](Pastedimage20221230200246.jpg)

{% note primary %}
**String**也可以是整数和浮点数，支持自增和自减操作。
**Zset**说是set，实际上结构类似hash，其保存了**字符串成员**和**浮点分数**之间的映射关系。
{% endnote %}

## String
String类型是二进制安全的，意思是 redis 的 string 可以包含任何数据。如数字，字符串，jpg图片或者序列化的对象。
### 命令
GET,SET,INCR,DECR,INCRBY,DECRBY
### 应用
缓存常用信息，计数器，session.

## List
Redis用双端链表实现List。
### 命令
LPUSH,LPOP,**LRANGE**(获取范围内元素),LINDEX(获取索引元素)
### 应用
时间轴微博，消息队列（按照时间先后排序的场景）

## Set
无序集合，成员唯一。
### 命令
SADD,**SCARD**(获取成员数),SMEMERS(返回所有成员),SISMEMBER(判断是否为成员)
### 应用
文章标签，不需要时间排序的点赞、收藏等。

## Hash
field -> value，适合存储对象
### 命令
HSET,HGET,HGETALL,HDEL
### 应用
缓存查询信息，适合存储结构体。

## Zset
成员唯一。通过了压缩列表和跳跃表两种数据结构实现。
压缩列表：提高了存储效率，特殊编码的双向链表。
跳跃表：快速查找，删除，添加（对数时间内）
{% note primary %}
操作时按照跳跃表找到指定位置对数据进行修改，存储时以压缩列表形式存储。
{% endnote %}
### 命令
ZADD,ZRANGE,ZREM
### 应用
排行榜

# 四、Redis特殊类型结构
## HyperLogLog

>Redis 2.8.9 版本更新了 Hyperloglog 数据结构

基数统计，可以理解为高性能的set，但精确度有限（0.81% 标准误差）。
基数指的是set中每一个不重复的元素，其可以解决海量数据统计的问题，其优势在于存储消耗的空间很小。

### 命令
``` shell
pfadd key1 a b c  #创建第一组元素
pfcount key1 #统计元素个数
pfmerge key3 key1 key2 #合并key1,key2到key3
```
### 应用
每日访问IP数，在线用户数等

## Bitmap
位存储，使用位记录 0，1两个状态。
### 命令
``` shell
setbit key 0 1  #设置第0位为1
getbit key 0 #获取第0位
bitcount key #求1的数量
```
### 应用
记录每条的打卡情况

## geospatial
>Redis 的 Geo 在 Redis 3.2 版本就推出了!

### 命令
``` shell
geoadd china:city(相当于key) 118 32 beijing(相当于value对象)#即可以为一个区域添加多个点
geopos china:city beijing
geodist china:city beijing shenyang m #以M为单位求两地距离
georadius china:city 110 30 1000 km #求中国城市中，以110，30为中心，1000km为半径范围内所有城市。
geohash china:city beijing #较少使用,返回hash字符串
```
### 应用
附近的人code
### 底层
底层实现是Zset，其将经纬度转换为一个分数保存在其中。

# 五、消息队列Steam
借鉴了Kafka，是一种消息队列的实现。

>Redis的消息队列实现很多：
>- Pub/Sub，缺点：丢失的消息无法持久化。
>- List，缺点：不支持多播，持久化。

消息队列设计
![](Pastedimage20221230213704.png)

## Stream结构
![](Pastedimage20221230214054.png)
- `Stream`：一种数据结构，每个Stream有一个唯一的名称，也就是key。
- `Comsumer Group`消费组：一个消费组有多个消费者，他们之间是**竞争关系**
- `pending_ids`消费者状态变量：维护了消费者尚未确认的id。

{% note primary %}
对于每一条消息都要确保其被消费，或者确定这是一个投递不出去的坏消息（死信）。所以需要对**每个消费者**维护一个**pending_ids**，表示这个消息已经交给它处理，但它还没有完成对该消息的确认（ack）。

而对于**每个消费组**，则需要一个指针维护其最后一次读取到的消息id（**Last_dilivered_id**）。
{% endnote %}

另外，每个消息都有独一无二的ID，默认为时间戳，格式为1527846880572-5，当毫秒不够用时，使用`-`后面的数标注该消息是本毫秒的第几个消息。

## 增删改查
- XADD - 添加消息到末尾
- XTRIM - 对流进行修剪，限制长度
- XDEL - 删除消息
- XLEN - 获取流包含的元素数量，即消息长度
- XRANGE - 获取消息列表，会自动过滤已经删除的消息
- XREVRANGE - 反向获取消息列表，ID 从大到小
- XREAD - 以阻塞或非阻塞方式获取消息列表

## 独立消费
即不使用消费组的情况下进行消费。
```shell
xread count 2 streams key 0-0 #读取两条消息
xread block 0 count 1 streams key $ #阻塞读取队列最后的消息
```

block 0表示永远阻塞，直到消息到，block 1000表示阻塞1s，如果1s内没有任何消息到来，就返回nil。

>独立消费不会自动维护last_read指针，需要用户自己记住最后消息ID，下次将其作为参数传递即可继续消费。

## 消费组消费
![](Pastedimage20221230231440.png)
### 相关命令
- XGROUP CREATE - 创建消费者组
- XREADGROUP GROUP - 读取消费者组中的消息
- XACK - 将消息标记为"已处理"
- XGROUP SETID - 为消费者组设置新的最后递送消息ID
- XGROUP DELCONSUMER - 删除消费者
- XGROUP DESTROY - 删除消费者组
- XPENDING - 显示待处理消息的相关信息
- XCLAIM - 转移消息的归属权
- XINFO - 查看流和消费者组的相关信息；
- XINFO GROUPS - 打印消费者组的信息；
- XINFO STREAM - 打印流信息
具体使用见[消费组命令使用](https://www.pdai.tech/md/db/nosql-redis/db-redis-data-type-stream.html)

xreadgroup也可以阻塞等待，读取后，消息进入消费者的pending_ids，当消费者回复xack时，将这个消息从其pending_ids消除。

{% note primary %}
消费时，需要传入流名称、消费组名称、消费者名称3个参数。
ACK时，需要传入流名称、消费组名称、消息id。
可见回复时，不需要具体定位到消费者，因为redis本身就知道某个消息id属于消费组中的哪个消费者。
{% endnote %}

## 信息监控
`Xinfo`命令可以查看stream的基本信息，如：
- XINFO STREAM keyName
- XINFO GROUPS keyName
- XINFO CONSUMERS keyName groupName

## 应用场景
实时通讯、大数据分析、异地数据备份。

## 其他问题
### 时间回拨问题
XADD生成的1553439850328-0，就是Redis生成的消息ID，由两部分组成:**时间戳-序号**。时间戳是毫秒级单位，是生成消息的Redis服务器时间，它是个**64位整型**（int64）。序号是在这个毫秒时间点内的消息序号，它也是个64位整型。

Redis生成的ID是单调递增有序的。若服务器时间错误，Redis的每个Stream类型数据都维护一个latest_generated_id属性，用于记录最后一个消息的ID。**若发现当前时间戳退后（小于latest_generated_id所记录的），则采用时间戳不变而序号递增的方案来作为新消息ID**（这也是序号为什么使用int64的原因，保证有足够多的的序号）。

### 消费者崩溃带来的会不会消息丢失问题?
Pending列表可以记录已读取但未ack的消息。
命令`XPENDIING`用来获消费组或消费内消费者的未处理完毕的消息。

每个Pending的消息有4个属性：
- 消息ID
- 所属消费者
- IDLE，已读取时长
- delivery counter，消息被读取次数

其保证消费者恢复时，可重新从pending列表中取消息处理。


### 消费者彻底宕机后如何转移给其它消费者处理？
使用`XCLAIM`将目标消费者和消息ID转移到自己的pending列表中，同时需要提供**IDLE（已被读取时长）**，只有超过这个时长，才能被转移。

### 坏消息问题，Dead Letter，死信问题
delivery counter，反复转给各个消费者时会累加，当到达临界值时将该消息视为死信，此时可以处理该消息，一般删除即可，XDEL。

# 六、发布订阅详解
Redis 发布订阅(pub/sub)是一种消息通信模式：发送者(pub)发送消息，订阅者(sub)接收消息。

Redis有两种发布/订阅模式：
- 基于频道(Channel)的发布/订阅
- 基于模式(pattern)的发布/订阅

## 基于频道的发布和订阅
```shell
publish channel:1 hi #发布消息

subscribe channel:1 #订阅频道，随后进入订阅状态
```
处于订阅状态下客户端不能使用除`subscribe`、`unsubscribe`、`psubscribe`和`punsubscribe`这四个属于"发布/订阅"之外的命令，否则会报错。

## 基于模式(pattern)的发布/订阅
如果有某个/某些模式和这个频道匹配的话，那么所有订阅这个/这些频道的客户端也同样会收到信息。
![](db-redis-sub-6.svg)
通配符中`?`表示1个占位符，`*`表示任意个占位符(包括0)，`?*`表示1个以上占位符。

- psubscribe可以重复订阅一个频道，会收到多条消息。
- subscribe和psubscribe是相互独立的，接受到消息时也会有区别。
- 使用punsubscribe只能退订通过psubscribe命令订阅的规则。

## 底层原理
### 基于频道
![](db-redis-sub-4.svg)
- 订阅时，将客户端添加到对应channel的list中
- 发布时，订阅到channel，发送给List中所有客户端。

### 基于模式
- 订阅时，程序就创建一个包含客户端信息和被订阅模式的`pubsubPattern`结构，并将该结构添加到 `redisServer.pubsub_patterns` 链表中。
![](db-redis-sub-10.svg)
- 发布时，遍历pubsubPattern，逐一对比看是否要发送。