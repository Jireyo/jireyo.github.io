---
title: Redis第2章（对象机制）
categories:
 - [八股,Redis,基础]
date: 2023-01-03 18:57:00
tag:
 - Redis
 - 八股
---
# 引入
>前面介绍了Redis的基本数据类型，针对这些数据类型有着不同的底层实现。

对象模型：
![](Pasted-image-20230103190013.png)

>Redis对象有不同的数据类型，而一个数据类型可能有多种实现方式（编码类型），根据value的情况灵活变化。
>编码类型作为一种类型标识，告诉了Redis应该如何解析这个对象，不同编码类型也有不同的底层数据结构实现。

Redis对象机制作用：
**Redis 必须让每个键都带有类型信息, 使得程序可以检查键的类型, 并为它选择合适的处理方式**.
**操作数据类型的命令除了要对键的类型进行检查之外, 还需要根据数据类型的不同编码进行多态处理**.

# redisObject数据结构
```c
typedef struct redisObject {
    // 类型
    unsigned type:4;
    // 编码方式
    unsigned encoding:4;
    // LRU - 24位, 记录最末一次访问时间（相对于lru_clock）; 或者 LFU（最少使用的数据：8位频率，16位访问时间）
    unsigned lru:LRU_BITS; // LRU_BITS: 24
    // 引用计数
    int refcount;
    // 指向底层数据结构实例
    void *ptr;
} robj;
```
![](Pasted-image-20230103190705.png)
- type标识了数据所属的基本类型
- encoding标识了数据类型对于的编码
- LRU记录了数据的最后访问时间和访问次数
- refcount记录了对象被引计数
- ptr指向真实的底层数据结构

{% note primary %}
redisObject保存了Redis服务器需要维护的对象信息，包括数据结构类型和编码（用于多态解析），LRU（LFU）和refcount（淘汰机制），ptr指向底层数据结构。
{% endnote %}

## 命令检查与多态
![](Pasted-image-20230103191229.png)
{% note success %}
type判断命令是否正确，encoding判断如何执行命令
{% endnote %}
## 对象共享
redis一般会把一些常见值放入共享对象中：
- 各种命令的返回值，比如成功时返回的OK，错误时返回的ERROR，命令入队事务时返回的QUEUE，等等
- 包括0在内，小于REDIS_SHARED_INTEGERS的所有整数（REDIS_SHARED_INTEGERS的默认值是10000）
![](Pasted-image-20230103192218.png)
>注意：共享对象只能被字典和双向链表这类能带有指针的数据结构使用。
>像整数集合和压缩列表这些将数据保存在数据结构内的则无法使用。

>为什么不共享其他数据结构：
>复杂度较高，消耗CPU，用其换取内存不划算。

## 引用计数
>redisObject中有refcount属性，是对象的引用计数，显然计数0那么就是可以回收。
- 当对象的refcount降至0 时，这个RedisObject结构，以及它引用的数据结构的内存都会被释放。

# 底层数据对象
## 简单动态字符串 - sds

**简单动态字符串（simple dynamic string,SDS**）的存在是为了尽可能的节省存储可见，只为对象分配其需要的空间大小。

### 结构
![](Pasted-image-20230103192512.png)

SDS有五种不同的头部. 其中sdshdr5实际并未使用到. 所以实际上有四种不同的**头部**, 分别如下:
![](Pasted-image-20230103192821.png)
其中：
- `len` 保存了SDS保存字符串的长度
- `buf[]` 数组用来保存字符串的每个元素
- `alloc`分别以uint8, uint16, uint32, uint64表示整个SDS, 除过头部与末尾的`\0`, 剩余的字节数。
- `flags` 始终为一字节, 以低三位标示着头部的类型, 高5位未使用

{% note primary %}
实际SDS的长度为 头部+alloc+尾部。
len为`buf[]`中的有效长度，即有效字符串长度。
{% endnote %}

### 为何使用SDS
- **常数复杂度获取字符串长度**：只需要读取len属性即可了解SDS字符串长度，时间复杂度为O(1)。
- **杜绝缓冲区溢出**：修改字符串时，首先看len是否满足需求，不满足则进行可见扩展
- **减少修改字符串的内存重新分配次数**：对于修改字符串SDS实现了**空间预分配**和**惰性空间释放**两种策略：
	- `空间预分配`：对字符串进行空间扩展的时候，扩展的内存比实际需要的多，这样可以减少连续执行字符串增长操作所需的内存重分配次数。
	- `惰性空间释放`：缩短后多余的字节，而是使用 `alloc` 属性将这些字节的数量记录下来，等待后续使用。
- **二进制安全**：SDS不以空字符串判断结束，而是以len属性判断。

>在当前版本中，当新字符串的长度小于1M时，redis会分配他们所需大小一倍的空间，当大于1M的时候，就为他们额外多分配1M的空间。

## 压缩列表 - ZipList
ziplist是一个特殊编码的双向列表，其可以存储字符串或整数，操作的时间复杂度为O(1)，每次操作都需要重新分配ziplist的内存。

### 结构
![](Pasted-image-20230103194043.png)
- `zlbytes`字段的类型是uint32_t, 这个字段中存储的是整个ziplist所占用的内存的字节数
- `zltail`字段的类型是uint32_t, 它指的是ziplist中最后一个entry的偏移量. 用于快速定位最后一个entry, 以快速完成pop等操作
- `zllen`字段的类型是uint16_t, 它指的是整个ziplit中entry的数量. 这个值只占2bytes（16位）: 如果ziplist中entry的数目小于65535(2的16次方), 那么该字段中存储的就是实际entry的值. 若等于或超过65535, 那么该字段的值固定为65535, 但实际数量需要一个个entry的去遍历所有entry才能得到.
- `zlend`是一个终止字节, 其值为全F, 即0xff. ziplist保证任何情况下, 一个entry的首字节都不会是255

### Entry结构
一般
- `prevlen`：前一个entry的大小
- `encoding`：表示当前entry类型和长度
- `entry-data`:存储entry标识的数据
特殊
类型为int时，`encoding`和`entry-data`合并在一起表示，没有`entry-data`。

**prevlen**
前一个元素长度小于254（255用于zlend）的时候，prevlen长度为1个字节，值即为前一个entry的长度。
如果长度大于等于254的时候，prevlen用5个字节表示，第一字节设置为254，后面4个字节存储一个小端的无符号整型，表示前一个entry的长度；

**encoding编码**
encoding的长度和值根据保存的是int还是string，还有数据的长度而定；
前两位用来表示类型，当为“11”时，表示entry存储的是int类型，其它表示存储的是string；

### 为什么ZipList省内存
根据数据类型灵活变化编码规则，使用encoding标识entry类型和大小，是。
因为是双端列表，为了解决遍历问题，使用prevlen字段方便倒序遍历。

### 缺点
不预留空间，每次写操作都需要重新分配内存。
节点扩容可能导致后续所有prevlen字段扩容。

## QuickList
是一个以ziplist为节点的双端链表结构。

### 相关结构体
- `quicklistNode`, 宏观上, quicklist是一个链表, 这个结构描述的就是链表中的结点. 它通过zl字段持有底层的ziplist. 简单来讲, 它描述了一个ziplist实例
- `quicklistLZF`, ziplist是一段连续的内存, 用LZ4算法压缩后, 就可以包装成一个quicklistLZF结构. 是否压缩quicklist中的每个ziplist实例是一个可配置项. 若这个配置项是开启的, 那么quicklistNode.zl字段指向的就不是一个ziplist实例, 而是一个压缩后的quicklistLZF实例
- `quicklistBookmark`, 在quicklist尾部增加的一个书签，它只有在大量节点的多余内存使用量可以忽略不计的情况且确实需要分批迭代它们，才会被使用。当不使用它们时，它们不会增加任何内存开销。
- `quicklist`. 这就是一个双链表的定义. head, tail分别指向头尾指针. len代表链表中的结点. count指的是整个quicklist中的所有ziplist中的entry的数目. fill字段影响着每个链表结点中ziplist的最大占用空间, compress影响着是否要对每个ziplist以LZ4算法进行进一步压缩以更节省内存空间.
- `quicklistIter`是一个迭代器
- `quicklistEntry`是对ziplist中的entry概念的封装. quicklist作为一个封装良好的数据结构, 不希望使用者感知到其内部的实现, 所以需要把ziplist.entry的概念重新包装一下

### 主体结构
![](Pasted-image-20230103200220.png)

- `quicklist.fill`影响ziplist的长度，数值为负数时限制ziplist最大长度，为正数时限制ziplist的entry数量。
- `quicklist.compress`影响zl字段指向的对象的类型，0标识指向ziplist，1表示链表的头尾节点不压缩，2标识头尾各2各节点不压缩，其他为压缩后的quicklistLZF。

- `quicklistNode.encoding`，标识本链表节点是否压缩，1表示没压缩，2表示压缩了。
- `quicklistNode.container`字段指示的是每个链表结点所持有的数据类型是什么. 默认的实现是ziplist, 对应的该字段的值是2, 目前Redis没有提供其它实现. 所以实际上, 该字段的值恒为2
- `quicklistNode.recompress`字段指示的是当前结点所持有的ziplist是否经过了解压。如果该字段为1即代表之前被解压过, 且需要在下一次操作时重新压缩.

## 字典/哈系表 - Dict
### 结构
![](Pasted-image-20230103201159.png)
### 一些要点
- 哈希算法：使用hash函数计算key的哈希值，使用sizemask与第一步得到的hash值，计算索引。
- 哈希冲突：链地址法
- 扩容/缩容：
	- rehash，扩展时创建两倍大小的hash表，缩小时则创建缩小一倍的新哈希表。
	- 重新计算索引
	- 迁移所有键值对，然后释放内存
- 扩容条件：
	1. 服务器目前没有执行 BGSAVE 命令或者 BGREWRITEAOF 命令，并且负载因子大于等于1。
	2. 服务器目前正在执行 BGSAVE 命令或者 BGREWRITEAOF 命令，并且负载因子大于等于5。
	3. ps：负载因子 = 哈希表已保存节点数量 / 哈希表大小。
- 渐进式rehash
	分多次完成rehash迁移，此时查找会在新旧两个哈希表上找，但是新增只会在新哈希表上新增。

## 整数集 - IntSet
### 结构
![](Pasted-image-20230103202006.png)

- `encoding` 表示编码方式，的取值有三个：INTSET_ENC_INT16, INTSET_ENC_INT32, INTSET_ENC_INT64
- `length` 代表其中存储的整数的个数
- `contents` 指向实际存储数值的连续内存区域, 就是一个数组；整数集合的每个元素都是 contents 数组的一个数组项（item），各个项在数组中按值得大小**从小到大有序排序**，且数组中不包含任何重复项。

{% note primary %}
可见intset就是一个排序的数组。
{% endnote %}

contents中每个元素的数据类型由encoding决定，当有数字的值超出范围时，集合需要升级，其会：
- 扩展整数集合底层数组的可见大小，并为新元素分配空间。
- 将底层数组现有的所有元素都转换成与新元素相同的类型，并将类型转换后的元素放置到正确的位上。（需要继续维持底层数组的有序性质不变）。
- 最后改变encoding的值，length+1。

但intset不会降级，这是没必要的开销。

## 跳表 - ZSkipList
跳表在redis中只用在zset数据类型中，其保证查找删除添加等操作在对数的期望时间内完成。

原理示例：
![](Pasted-image-20230103202637.png)

内存布局：
![](Pasted-image-20230103202658.png)

**zskiplist的核心设计要点**
- **头节点**不持有任何数据, 且其`level[]`的长度为32。
- **每个结点**
    - `ele`字段，持有数据，是sds类型
    - `score`字段, 其标示着结点的得分, 结点之间凭借得分来判断先后顺序, 跳跃表中的结点按结点的得分升序排列.
    - `backward`指针, 这是原版跳跃表中所没有的. 该指针指向结点的前一个紧邻结点.
    - `level`字段, 用以记录所有结点(除过头节点外)；每个结点中最多持有32个zskiplistLevel结构. 实际数量在结点创建时, 按幂次定律随机生成(不超过32). 每个zskiplistLevel中有两个字段
        - `forward`字段指向比自己得分高的某个结点(不一定是紧邻的), 并且, 若当前zskiplistLevel实例在`level[]`中的索引为X, 则其forward字段指向的结点, 其`level[]`字段的容量至少是X+1. 这也是上图中, 为什么forward指针总是画的水平的原因.
        - `span`字段代表forward字段指向的结点, 距离当前结点的距离. 紧邻的两个结点之间的距离定义为1


### 为什么不用平衡树或者哈希表
hash无序，无法进行范围查找，平衡数的范围搜索也很复杂，子树的调整也很复杂。

# redis对象与编码(底层结构)对应关系
![](Pasted-image-20230103203244.png)
## String
**字符串长度不能超过512M。**
### 编码
- `int 编码`：保存的是可以用 long 类型表示的整数值。
- `embstr 编码`：保存长度小于44字节的字符串（redis3.2版本之前是39字节，之后是44字节）。
- `raw 编码`：保存长度大于44字节的字符串（redis3.2版本之前是39字节，之后是44字节）。
### 结构
![](Pasted-image-20230103203355.png)
embstr少一次分配空间，但其为只读,修改时要重新分配一次raw空间。

ps:**Redis中对于浮点数类型也是作为字符串保存的，在需要的时候再将其转换成浮点数类型**。

- **编码的转换**
>当 int 编码保存的值不再是整数，或大小超过了long的范围时，自动转化为raw。
>对于embstr编码，由于 Redis 没有对其编写任何的修改程序（embstr 是只读的），在对embstr对象进行修改时，都会先转化为raw再进行修改，因此，只要是修改embstr对象，修改后的对象一定是raw的，无论是否达到了44个字节。

### 注意
按**数值进行操作的数据**，如果原始数据不能转成数值，或超越了redis数值上限范围，将报错。 9223372036854775807（java中long型数据最大值，Long.MAX_VALUE）


## List
### 编码
quicklist
### 结构
![](Pasted-image-20230103203823.png)
### 注意
- list中保存的数据都是string类型的，数据总容量是有限的，最多2^32 - 1 个元素 (4294967295)。

## Hash
### 编码
ziplist和hashtable

### 结构
- ziplist
- dict
![](Pasted-image-20230103204020.png)

使用ziplist时，新的键值对作为entry插入list尾部。
使用hashtable编码时，使用dict。

**编码转换**
和上面列表对象使用 ziplist 编码一样，当**同时满足下面两个条件**时，使用ziplist（压缩列表）编码：
1. 列表保存元素个数小于512个
2. 每个元素长度小于64字节
不能满足这两个条件的时候使用 hashtable 编码。以上两个条件也可以通过Redis配置文件`zset-max-ziplist-entries` 选项和 `zset-max-ziplist-value` 进行修改。

### 注意
- hash类型下的value只能存储字符串
- 每个hash可以存储2^32-1个键值对

## Set
### 编码
intset或hashtable
### 结构
![](Pasted-image-20230103204842.png)

**编码转换**
当集合同时满足以下两个条件时，使用intset编码：
1. 集合对象中所有元素都是整数
2. 集合对象所有元素数量不超过512
不能满足这两个条件的就使用hashtable编码。第二个条件可以通过配置文件的 `set-max-intset-entries` 进行配置。

## ZSet
### 编码
ziplist 或 skiplist(ziplist+dict)

### 结构
ziplist
![](Pasted-image-20230103205150.png)

skiplist(ziplist+dict)
![](Pasted-image-20230103205236.png)
字典可以快速查找成员，但无序，跳表可以快速执行范围查找，将两者结合共同实现有序集合。

**编码转换**
当有序集合对象同时满足以下两个条件时，对象使用 ziplist 编码：
1. 保存的元素数量小于128；
2. 保存的所有元素长度都小于64字节。
不能满足上面两个条件的使用 skiplist 编码。以上两个条件也可以通过Redis配置文件`zset-max-ziplist-entries` 选项和 `zset-max-ziplist-value` 进行修改。

### 注意
- score保存的数据存储空间是64位，如果是整数范围是-9007199254740992~9007199254740992
