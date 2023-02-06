---
title: Java第5章（集合）
categories:
 - [八股,Java,基础]
date: 2023-01-09 20:38:00
tag:
 - Java
 - 八股
---
# 集合知识体系
![](Pasted-image-20230109204736.png)
集合主要分Map和Collection两个体系:
- Map
	- SortedMap
		- NavigableMap
- Collection
	- List
	- Queue
		- Deque
	- Set
		- SortedSet
			- NavigableSet

{% note primary %}
以上都是接口，从功能角度上对集合进行了分类。
- Map作为字典，重要的是其搜索能力，所以其有sorted->navigable的继承接口。
- Collection中
	- List体现的是对数组的封装，可以随机获取。
	- Queue体现单端的进出（堆）
		- Deque实现双端的任意出入
	- Set需要去重，重要的同样是其搜索能力，所以与map类似，有sorted->navigable的继承。
{% endnote %}

{% note success %}
从基本的实现来看:
- Map
	- map的朴素实现是HashMap
		- HashMap有时需要保留先后顺序，LinkedHashMap继承自HashMap
	- map搜索增强的实现是TreeMap
	- 还有一些功能性Map(不做重点)，直接继承Map
		- WeakHashMap，软引用，处于缓存角度，键值可以被回收
		- IdentifyHashMap，判断两值相等，只看其引用地址的16位hash（强相等）
		- EnumMap，只允许key为指定枚举值，底层其实是array实现。
- Collection
	- list的朴素实现是ArrayList
		- vector还继承了list，是线程安全的，但已不推荐使用。
			- stack继承了vector，先入先出
	- queue的实现是PriorityQueue(堆)
		- deque的朴素实现是**LinkedList**，这个类也继承了List和Queue，三姓家奴
		- deque的另一个实现是ArrayDeque
	- set与map类似，有HashSet->LinkedHashSet,TreeSet等实现。
{% endnote %}


# ArrayList
## 简介
继承：ArrayList实现了List接口
null：允许放入null
底层实现：array
同步：同步类为vector

## 机制
### 底层

```java
transient Object[] elementData;
private int size;
```
### 扩容
- 当数组capacity == size时添加新元素
- 数组扩容通过一个公开的方法`ensureCapacity(int minCapacity)`来实现。
- 每次大约扩容1.5倍。
![](Pasted-image-20230109213925.png)

### add
- 每次add前通过`ensureCapacity()`确保容量足够
- `add(int index,E e)`，需要先对元素进行移动
![](Pasted-image-20230109214209.png)
- `addAll()`，注意addAll不会调用add，其需要保证modCount只+1次。

### set()/get()
直接操作数组即可，不过要检查参数索引是否越界。

### remove()
- `remove(int index)`移除指定坐标，原地copy数组完成
- `remove(Object o)`移除指定对象，底层通过equals判断

### trimToSize()
将底层数组的容量调整为当前列表保存的实际元素的大小。

### indexOf(), lastIndexOf()
获取元素的第一次出现的index，也通过equals判断。

### Fail-Fast机制
快速失败，modCount标记操作数，避免并发带来的不确定风险。

{% note primary %}
注意，除了扩容，其他的remove操作只会在原数组上进行copy，通过size维护有效数组大小即可。
{% endnote %}

# LinkedList
注意不存在哑节点。
## 简介
LinkedList同时实现了List接口和Deque接口。
不过现在的首选是ArrayDeque，其底层通过数组实现，性能更好。
## 机制
### 底层
```java
transient int size = 0;
transient Node<E> first;
transient Node<E> last;
```
### get()
- `getFirst()`, `getLast()`直接获取即可。
- `get(int index)`，通过`node(index)`获取节点并修改。

### remove()
底层调用unlink方法释放节点。
- `removeFirst()`, `removeLast()`直接删除，调整指针即可。
- `remove(e)`需要迭代equals判断
- `remove(index)`同理（调用`node(index)`）
ps:
- 注意，以上方法都会先对操作的可行性进行判断。
- 查找指定索引节点的方法为`node(index)`，其会根据index判断从前开始找还是从后开始找速度快。

### add()
- `add(E e)`直接加到尾部
- `add(int index,E e)`需要线性查找(也会先找`node(index)`)

### addAll()
同arraylist，不会调用add()。

### clear()
会迭代将node之间引用清空，加快清理速度。

### indexOf()
通过equals迭代判断。

### Queue方法
上面都是一些list方法的实现，linkedlist还实现了queue和deque，以下是对这些类的实现。
peek(),element(),poll(),remove(),offer()
- peek,element,poll,remove都是操作头元素，offer操作尾元素
- element调用`getFirst()`会抛出空异常，peek()返回null。

### Deque方法
offerFirst,offerLast,peekFirst,peekLast,pollFirst,pollLast,push,pop
- push，pop都操作头元素。

{% note primary %}
记忆，
- `peek,push,pop`属于栈方法，操作头元素
- `peek,offer,poll`属于队列方法，默认操作头元素，不会异常，且有双端方法可以使用
- `add,remove`属于list方法，操作尾部元素
{% endnote %}

# Stack
stack是一个具体的实现类，而Queue却没有，这是一个反常理的事情，不过现在Java已经不推荐使用Stack了，`ArrayDeque`往往更高效。

# Queue
Queue是一个接口，实现了Collection接口，其队列特殊方法不会抛出异常。

## Deque
deque是一个接口，实现了Queue接口，表示双向队列，支持双向的队列操作。
deque常见的实现是LinkedList和ArrayDeque

### ArrayDeque
底层通过数组实现，且数组为循环数组，即任一点都可以是起点或终点，如下图。
![](Pasted-image-20230109232400.png)
### 机制
ArrayDeque不允许放入null
#### addFirst
`elements[head = (head - 1) & (elements.length - 1)] = e`
会对head-1取模，如果`head-1==-1`,则得到的head=`elements.length - 1`，通过判断head == tail即可判断其容量满了。


{% note primary %}
elements.length总为偶数，-1后为全1。
`(head - 1) & (elements.length - 1)`相当于对`head-1`对`elements.length-1`做取模处理。
- head值若超过length-1，则相当于取余
- head-1若为负数，相当于取对element.length的补码。
- 实际上head-1最小为-1，取补码后等于element.length-1。
{% endnote %}

#### 扩容
容量满了就需要扩容，方法是`doubleCapacity()`。
![](Pasted-image-20230109233801.png)
- 第一次复制`head`右边的元素。
- 第二次复制`head`左边的元素。
#### addLast
`(tail = (tail + 1) & (elements.length - 1)) == head`
tail+1取模，若`tail+1==elements.length-1`，则得到的tail = 0，通过判断head == tail即可判断其容量满了。

### pollFirst(),pollFirst(),peekLast()，pollLast()
返回对应值，为空则返回Null。

{% note primary %}
注意，ArrayList扩容是1.5倍，ArrayDeque扩容是2倍。
{% endnote %}

## PriorityQueue
### 简介
**优先队列的作用是能保证每次取出的元素都是队列中权值最小的**(Java的优先队列每次取最小元素，C++的优先队列每次取最大元素)。这里牵涉到了大小关系，元素大小的评判可以通过元素本身的自然顺序(natural ordering)，也可以通过构造时传入的比较器(Comparator，类似于C++的仿函数)。
- 优先队列不允许放入`null`元素。
- 其通过完全二叉树的小顶堆实现。

### 机制
#### 底层
PriorityQueue底层通过数组维护堆结构
`leftNode = parentNode*2+1`
`rightNo = parentNo*2+2`
`parentNo = (nodeNo-1)/2`

#### 扩容
使用`grow()`函数，会复制原数组元素到新数组

#### element(),peek()
一个会抛异常，一个不会。都返回下标为0的元素。

#### add(),offer()
add、offer，添加在数组末尾，然后逐步向上调节。
会调用`siftUp(int k, E x)`，用于在指定位置插入节点并进行调整。

#### remove(),poll()
一个会抛异常，一个不会，都移除下标为0的元素，然后进行堆调整。
会调用`siftDown(int k, E x)`，用于在指定位置删除节点并进行调整。

{% note primary %}
siftUp，siftDown会根据指定元素x，不断对该位置及其上/下的节点进行比较并移动，直到满足找到x小于/大于目标节点的时候截至。
{% endnote %}

#### remove(Object o)
遍历数组删除第一个equals的元素。

# HashSet&HashMap

二者在Java里有着相同的实现，前者仅仅是对后者做了一层包装，即默认value == null。

## HashMap
HashTable是同步的HashMap。该map不保证元素顺序。

### 实现
哈希表有两种实现方式，一种开放地址方式(Open addressing)，另一种是冲突链表方式(Separate chaining with linked lists)。

### Java7
HashMap采用的是冲突链表方式**。
![](Pasted-image-20230110203318.png)

可见put，get方法可以在常数时间完成，但若table过大，对map进行遍历就会很耗时。

有**两个参数**可以影响HashMap的性能: 初始容量(*inital capacity*)和负载系数(*load factor*)。
- 初始容量指定了初始`table`的大小
- 负载系数用来指定自动扩容的临界值。
当`entry`的数量超过`capacity*load_factor`时，容器将自动扩容并重新哈希。对于插入元素较多的场景，将初始容量设大可以减少重新哈希的次数。

将对象放入到HashMap或HashSet中时，有**两个方法**需要特别关心：`hashCode()`和`equals()`。
- **`hashCode()`方法决定了对象会被放到哪个`bucket`里，当多个对象的哈希值冲突时，`equals()`方法决定了这些对象是否是“同一个对象”**。
- 所以，如果要将自定义的对象放入到`HashMap`或`HashSet`中，需要@Override `hashCode()`和`equals()`方法。

#### get()
先`getEntry`，然后`getValue`
其中getEntry先通过hashCode判断bucket，然后通过equals遍历判断。

求bucket的过程：
`hash(k)&(table.length-1)`，与list扩容类似，取模。

#### put()
先`getEntry`，如果没有则`addEntry`。在链表中使用头插法。

#### remove()
先`getEntry`，然后remove。

### Java8
由 **数组+链表+红黑树** 组成。
当链表中的元素达到了 8 个时，会将链表转换为红黑树，在这些位置进行查找的时候可以降低时间复杂度为 O(logN)。
![](Pasted-image-20230110204320.png)
链表的元素为`Node`，红黑树的元素为`TreeNode`，通过头节点的类型判断是链表还是红黑树。

#### 数组扩容
resize() 方法用于初始化数组或数组扩容，每次扩容后，容量为原来的 **2 倍**，并进行数据迁移。
ps:java7是先扩容再插值，java8是先插值再扩容。

#### get()
判断是红黑树还是链表，采用不同方法取值。

具体红黑树讲解见TreeMap

## HashSet
就是对HashMap的一层包装。

# LinkedHashMap&LinkedHashSet
## LinkedHashMap
实现了map接口，**允许放入key或value为null的元素**，也是HashMap的子类。其使用双向链表将所有entry相连接。并多了header和tail指向`头部`和`尾部`。

优点：遍历时不用遍历所有bucket，只用遍历entrylist即可。

有**两个参数**可以影响LinkedHashMap的性能: 初始容量(inital capacity)和负载系数(load factor)。
将对象放入到LinkedHashMap或LinkedHashSet中时，有**两个方法**需要特别关心: `hashCode()`和`equals()`。

这点与HashMao相同。
其没有同步化实现，若需要同步，可使用：
`Map m = Collections.synchronizedMap(new LinkedHashMap(...));`

### get()
同HashMap
### put()
也是先getEntry，然后再addEntry
add时，既要使用头插法插入bucket链表头部，也要将其插入linkedlist的尾部。
### remove()
同样先get，然后remove，同时维护两个链表。

## LinkedHashSet
是LinkedHashMap的简单包装。

# TreeSet&TreeMap
## TreeMap
TreeSet是对TreeMap的一层包装。

底层通过红黑树实现。意味着`containsKey()`, `get()`, `put()`, `remove()`都有着`log(n)`的时间复杂度。

TreeSort是非同步的，若需要同步，可以使用：
`SortedMap m = Collections.synchronizedSortedMap(new TreeMap(...));`

## 红黑树
参考视频：[bilibili](https://www.bilibili.com/video/BV1d64y1z7Uk?p=20&vd_source=7324e975d0c1b4b4719d1194e3649ff8)
参考blog：[bilibili](https://www.bilibili.com/read/cv17486236)
**红黑树是一种近似平衡的二叉查找树，它能够确保任何一个节点的左右子树的高度差不会超过二者中较低那个的一倍**。

性质：
1. 每个节点要么是红色，要么是黑色。
2. 根节点必须是黑色
3. 红色节点不能连续(也即是，红色节点的孩子和父亲都不能是红色)。
4. 对于每个节点，从该点至`null`(树尾端)的任何路径，都含有相同个数的黑色节点。
树结构改变时，任意破坏3，4，因此需要调整。

### 预备知识
#### 234树
一种特殊的搜索树。
- 2节点表示3个key组成的一个节点
- 3节点表示3个key组成的一个节点
- 4节点表示3个key组成的一个节点

当给234树添加节点时
- 通过搜索找到应该插入的节点。
- 如果该节点位置已经有不超过3个节点，则可以进行合并。
- 如果已经为4节点，则需要拆解出节点并向上移动。

因为这样自底向上的插入性质，其所有根节点的高度总是相等的。

#### 红黑树
红黑树是可以和234树等价的。
- 2节点表示一个黑节点
- 3节点表示一个红节点和其一个黑子节点
- 4节点表示一个红节点和其两个黑子节点

另外红黑树每个叶子节点都是黑节点（一般是隐藏的，其不会影响红黑树的3，4性质）

#### 左旋/右旋
以x节点为中心左旋，其右子节点r会成为x节点的父节点。右子节点r的左节点rl会称为x的右节点。
右旋同理，左右旋主要是为了调整树的节点构造，在不影响整体高度的情况下达到我们想要构造。

#### 节点后继
搜索树中某节点x有前继pre（比x小的最大节点）和后继post（比x大的最小节点）节点。这两个节点可以完美替换节点x。

### 方法
#### get()
按照常规二叉搜索树寻找即可。
底层根据compareTo()的返回值判断进行迭代。

#### put()
先查找，若没有，则add。
其可能破坏红黑树约束条件，因此需要调整。
1.默认插入RED节点。
2.1.若其父节点也为BLACK节点，不影响高度（return）。
2.2.若其父节点也为RED，需要调整父节点及其叔叔节点为BLACK(+1)，并让爷爷节点为RED(-1)。
3.迭代至根节点。

#### remove()
先查找，若有，则remove。
其可能破坏红黑树约束条件，因此需要调整。

1.可能移除树中任意位置的节点，可以通过**值替换**的方式转化为移除其前继或**后继**节点，最终只会删除叶子节点或有单侧叶子节点的节点

2.1.若移除的是RED节点，不影响高度(return)。
2.1.1如果该节点是叶子节点，直接(return)
2.1.2如果该节点有单侧叶子节点，由叶子节点替代该节点（return）。

2.2.若移除的是BALCK节点L，需要调整。
2.2.1如果该节点是叶子节点，需要先调整，再移除
2.2.2如果该节点有单侧子节点，由子节点替代该节点后，再调整。

{% note primary %}
所谓调整，本质上是一个方法 f(Node node)，其能让node节点这一侧补充一个黑色节点高度。核心思想是，由于移除了黑色节点L，该侧高度（-1），需要找一个节点（且为黑色）补充回来。
- 如果L有红色子节点，将其提升后染黑即可。
- 如果L没有红色子节点，需要将其父节点P的左/右旋，将P移到该侧填补黑色节点。然后由其兄弟节点提升多余节点（兄弟节点有红色子节点）代替父节点并进行调整。
- 如果兄弟节点R没有多余红色节点，则将兄弟节点一起染红，然后迭代其父节点P作为L。
{% endnote %}

2.3.1.如果替代上来的节点是红色节点，将其染黑即可(return)
2.3.2.如果原节点(2.2.1)或替代上来的节点是黑色节点(2.2.2)，需要进行旋转调整。
2.3.3.事实上这不会容易，父节点P左旋时，其右节点R会成为新的父节点，这会导致右侧减去一个节点R，因此，右旋时要保证右侧的高度也不变，需要满足以下几种条件之一：
2.4.1.如果兄弟节点为红色，说明其不是真正的兄弟节点（因为234树中3节点和4节点都应该是黑色节点为根），此时应该**调整兄弟节点成黑色节点为根的形态**(通过左/右旋并调整颜色实现，达到2.4.2)。
2.4.2.如果兄弟节点为黑色，考虑其子节点是否有红色节点可以借用。
2.4.2.1.兄弟节点有红色子节点：
- 将父节点左旋，并染黑，补充L侧的黑节点个数
- 原兄弟节点成为新的父节点，将其调整为原父节点P的颜色
- 原兄弟节点的子节点成为新父节点的右节点，将其染黑补充R侧的黑节点个数
- return

2.4.2.2.兄弟节点没有红色子节点:
- 将兄弟节点染红，则导致父节点到叶子的路径总体-1，以父节点为新的L迭代2.2.1步，可以将其视为一个整体。

2.5最终达到root时，return。

# WeakHashMap
具体实现类似HashMap，弱引用可以访问对象，但这不是有效引用，即被引用的对象可以被GC回收。
WeakHashMap内部通过弱引用管理entry。
想要获取HashSet，需要使用：
`Collections.newSetFromMap(Map<E,Boolean> map)`，其可以将任意map转化为set。

# Null
PriorityQueue，TreeSet不允许传入空值，因为其需要比较，其他集合都可以传入Null。

# 线程安全

| 不安全        | 安全实现                                           | ConCurrent |
| ------------- | -------------------------------------------------- | ---------- |
| ArrayList     | Vector/Stack                                       | 暂无       |
| LinkedList    | Collections.synchronizedList(List)                 | 暂无       |
| PriorityQueue | 无                                                 | 暂无       |
| HashMap       | Hashtable                                          | 暂无       |
| LinkedHashMap | Collections.synchronizedMap(Map)                   | 暂无       |
| TreeMap       | Collections.synchronizedSortedMap(SortedMap);      | 暂无       |
| NavigableMap  | Collections.synchronizedNavigableMap(NavigableMap) | 暂无       |

Set的Collections包装方法类似map，待补充todo。