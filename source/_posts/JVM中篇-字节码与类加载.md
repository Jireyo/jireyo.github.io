---
title: JVM中篇:字节码与类加载
categories:
 - [八股,Java,JVM]
date: 2023-02-01 16:17:20
tag:
 - JVM
 - 八股
---

# 一、Class文件结构
| 类型    | 名称             | 说明                  | 长度             | 数量   |
|-------|----------------|---------------------|----------------|------|
| 魔数    | u4             | magic               | 魔数,识别Class文件格式 | 4个字节 | 1                       |
| 版本号   | u2             | minor_version       | 副版本号(小版本)      | 2个字节 | 1                       |
|       | u2             | major_version       | 主版本号(大版本)      | 2个字节 | 1                       |
| 常量池集合 | u2             | constant_pool_count | 常量池计数器         | 2个字节 | 1                       |
|       | cp_info        | constant_pool       | 常量池表           | n个字节 | constant_pool_count - 1 |
| 访问标识  | u2             | access_flags        | 访问标识           | 2个字节 | 1                       |
| 索引集合  | u2             | this_class          | 类索引            | 2个字节 | 1                       |
|       | u2             | super_class         | 父类索引           | 2个字节 | 1                       |
|       | u2             | interfaces_count    | 接口计数器          | 2个字节 | 1                       |
|       | u2             | interfaces          | 接口索引集合         | 2个字节 | interfaces_count        |
| 字段表集合 | u2             | fields_count        | 字段计数器          | 2个字节 | 1                       |
|       | field_info     | fields              | 字段表            | n个字节 | fields_count            |
| 方法表集合 | u2             | methods_count       | 方法计数器          | 2个字节 | 1                       |
|       | method_info    | methods             | 方法表            | n个字节 | methods_count           |
| 属性表集合 | u2             | attributes_count    | 属性计数器          | 2个字节 | 1                       |
|       | attribute_info | attributes          | 属性表            | n个字节 | attributes_count        |

>其中un表示有n个字节。

## 魔数
u4
`0xCAFEBABE`

## 版本号
u2+u2
主版本号和副版本号一起构成版本号：M.m
不同编译器的class文件不同，目前JVM可以向下兼容。

## 常量池集合
u2(常量数量)+ cp_info（常量表大小）
### constant_pool_count
u2，从1开始计数，所以constant_pool_count=1时说明有0个常量。
{% note primary %}
因为0索引被空出来作为“空常量”
{% endnote %}

### constant_pool
1 ~ constant_pool_count - 1为索引
主要存放**字面量Literal**和**符号引用Symbolic References**，其包含该class文件中如下内容：
- 字面量
	- 字符串
	- final常量
- 符号引用
	- 类，接口名
	- 方法名
	- 字段名

#### 结构
使用1byte表示该常量的类型：如字符串、符号引用等，即下表中的tag，剩余的部分根据类型不同而不同。
![](Pasted-image-20230201163645.png)
其中：只有CONSTANT_utf8_info的长度是不固定的，其本身也代表字符串，其他常量项的属性可以指向CONSTANT_utf8_info。


## 访问标识
| 标志名称           | 标志值    | 含义                                                                     |
|----------------|--------|------------------------------------------------------------------------|
| ACC_PUBLIC     | 0x0001 | 标志为public类型                                                            |
| ACC_FINAL      | 0x0010 | 标志被声明为final，只有类可以设置                                                    |
| ACC_SUPER      | 0x0020 | 标志允许使用invokespecial字节码指令的新语义，JDK1.0.2之后编译出来的类的这个标志默认为真。（使用增强的方法调用父类方法） |
| ACC_INTERFACE  | 0x0200 | 标志这是一个接口                                                               |
| ACC_ABSTRACT   | 0x0400 | 是否为abstract类型，对于接口或者抽象类来说，次标志值为真，其他类型为假                                |
| ACC_SYNTHETIC  | 0x1000 | 标志此类并非由用户代码产生（即：由编译器产生的类，没有源码对应）                                       |
| ACC_ANNOTATION | 0x2000 | 标志这是一个注解                                                               |
| ACC_ENUM       | 0x4000 | 标志这是一个枚举                                                               |

每一种类型的表示都是通过设置访问标记的32位中的特定位来实现的，即bitmap，这样只使用**2byte**即可表达所有访问标志。

### 补充
- 带有ACC_INTERFACE标志的class文件表示的是接口而不是类，反之则表示的是类而不是接口。
- ACC_SUPER标志用于确定类或接口里面的invokespecial指令使用的是哪一种执行语义。JDK8后，默认每个class文件都设置了ACC_SUPER标志，目的是向后兼容。

## 类索引、父类索引、接口索引

### this_class（类索引）
2byte，指向常量池

### super_class（父类索引）
2byte，指向常量池

### interfaces
指向常量池索引集合。
#### interfaces_count（接口计数器）
2byte，interfaces_count项的值表示当前类或接口的直接超接口数量。

#### interfaces（接口索引集合）
`interfaces_count*2byte`
每个成员的值必须是对常量池表中某项的有效索引值，长度为interfaces_count

## 字段表集合
### fields_count
fields_count的值表示当前class文件fields表的成员个数。使用两个字节来表示。

### fields_table
#### 基本结构
| 类型       | 标志值           | 含义       | 数量             |
| -------------- | ---------------- | ---------- | ---------------- |
| u2             | access_flags     | 访问标志   | 1                |
| u2             | name_index       | 字段名索引 | 1                |
| u2             | descriptor_index | 描述符索引 | 1                |
| u2             | attributes_count | 属性计数器 | 1                |
| attribute_info | attributes       | 属性集合   | attributes_count |

#### 访问标识符
| 标志名称          | 标志值    | 含义             |
|---------------|--------|----------------|
| ACC_PUBLIC    | 0x0001 | 字段是否为public    |
| ACC_PRIVATE   | 0x0002 | 字段是否为private   |
| ACC_PROTECTED | 0x0004 | 字段是否为protected |
| ACC_STATIC    | 0x0008 | 字段是否为static    |
| ACC_FINAL     | 0x0010 | 字段是否为final     |
| ACC_VOLATILE  | 0x0040 | 字段是否为volatile  |
| ACC_TRANSTENT | 0x0080 | 字段是否为transient |
| ACC_SYNCHETIC | 0x1000 | 字段是否为由编译器自动产生  |
| ACC_ENUM      | 0x4000 | 字段是否为enum      |

#### 描述符索引
| 标志符 | 含义                                                  |
| ------ | ----------------------------------------------------- |
| B      | 基本数据类型byte                                      |
| C      | 基本数据类型char                                      |
| D      | 基本数据类型double                                    |
| F      | 基本数据类型float                                     |
| I      | 基本数据类型int                                       |
| J      | 基本数据类型long                                      |
| S      | 基本数据类型short                                     |
| Z      | 基本数据类型boolean                                   |
| V      | 代表void类型                                          |
| L      | 对象类型，比如：`Ljava/lang/Object`;                    |
| `[`    | 数组类型，代表一维数组。比如：`double[][][] is [[[D ` |

#### 属性集合
每个字段还可以拥有不同的属性，如初始值，注释信息。这些属性的数量放在属性计数器attribute_count中，内容放在属性集合attributes中。

比如某常量字段拥有下面三个属性：
```java
ConstantValue_attribute{
	u2 attribute_name_index;
	u4 attribute_length;
    u2 constantvalue_index;
}
```

## 方法表集合
### methods_count
methods_count的值表示当前class文件methods表的成员个数。使用两个字节来表示。

### methods
methods表中的每个成员都必须是一个method_info结构：
| 类型           | 标志值              | 含义    | 数量               |
|----------------|------------------|-------|------------------|
| u2             | access_flags     | 访问标志  | 1                |
| u2             | name_index       | 方法名索引 | 1                |
| u2             | descriptor_index | 描述符索引 | 1                |
| u2             | attributes_count | 属性计数器 | 1                |
| attribute_info | attributes       | 属性集合  | attributes_count |

#### 访问标识
| 标志名称      | 标志值 | 含义                                |
| ------------- | ------ | ----------------------------------- |
| ACC_PUBLIC    | 0x0001 | public，方法可以从包外访问          |
| ACC_PRIVATE   | 0x0002 | private，方法只能本类访问           |
| ACC_PROTECTED | 0x0004 | protected，方法在自身和子类可以访问 |
| ACC_STATIC    | 0x0008 | static，静态方法                    |

## 属性表集合
这里与字段/方法表中的属性集合要分开，字段/方法中属性集合是描述字段/方法属性的，本处的属性表集合用来描述class文件的附加信息。
### attributes_count
attributes_count的值表示当前class文件属性表的成员个数。
### attributes
属性表中每一项都是一个attribute_info结构。
| 类型 | 名称                   | 数量               | 含义    |
|----|----------------------|------------------|-------|
| u2 | attribute_name_index | 1                | 属性名索引 |
| u4 | attribute_length     | 1                | 属性长度  |
| u1 | info                 | attribute_length | 属性表   |

各种属性的含义见官网，具体问题具体分析。


# 二、字节码指令集
## 概述
### 字节码与数据类型
对于大部分与数据类型相关的字节码指令，它们的操作码助记符中都有特殊的字符来表明专门为哪种数据类型服务：
- i代表对int类型的数据操作，
- l代表long
- s代表short
- b代表byte
- c代表char
- f代表float
- d代表double

{% note primary %}
注意，编译器会将boolean,byte,char,short作为int使用i开头的指令处理。
{% endnote %}

## 加载与存储
- xload，将**局部变量**加载到操作数栈。
- iconst、bipush等，**常量入操作数栈**
- xstore，**出栈装入局部变量表**

{% note primary %}
- x为a表示对象操作，如aload，即加载一个对象到操作数栈。
- 在x后加a表示从数组中操作，如iaload，即从`int[]`数组中取数。
{% endnote %}


## 算数指令
### 类型说明
![](Pasted-image-20230201172429.png)

### 运算模式
**向最接近数舍入模式**：JVM要求在进行浮点数计算时，所有的运算结果都必须舍入到适当的精度，非精确结果必须舍入为可被表示的最接近的精确值，如果有两种可表示的形式与该值一样接近，将优先选择最低有效位为零的；
**向零舍入模式**：将浮点数转换为整数时，采用该模式，该模式将在目标数值类型中选择一个最接近但是不大于原值的数字作为最精确的舍入结果；

### NaN值使用
对于浮点数，有特殊的表达式：
1/0.0 = Infinity
0.0/0.0 = NaN

### 算数指令
| 算数指令   | int(boolean,byte,char,short) | long | float         | double        |
| ---------- | ---------------------------- | ---- | ------------- | ------------- |
| 加法指令   | iadd                         | ladd | fadd          | dadd          |
| 减法指令   | isub                         | lsub | fsub          | dsub          |
| 乘法指令   | imul                         | lmul | fmul          | dmul          |
| 除法指令   | idiv                         | ldiv | fdiv          | ddiv          |
| 求余指令   | irem                         | lrem | frem          | drem          |
| 取反指令   | ineg                         | lneg | fneg          | dneg          |
| 自增指令   | iinc                         |      |               |               |
| 位运算指令 | 按位或指令                   | ior  | lor           |               |
|            | 按位或指令                   | ior  | lor           |               |
|            | 按位与指令                   | iand | land          |               |
|            | 按位异或指令                 | ixor | lxor          |               |
| 比较指令   |                              | lcmp | fcmpg / fcmpl | dcmpg / dcmpl |


## 类型转换
| 转化     | byte    | char    | short   | int | long | float | double |
|--------|---------|---------|---------|-----|------|-------|--------|
| int    | i2b     | i2c     | i2s     | ○   | i2l  | i2f   | i2d    |
| long   | l2i i2b | l2i i2c | l2i i2s | l2i | ○    | l2f   | l2d    |
| float  | f2i i2b | f2i i2c | f2i i2s | f2i | f2l  | ○     | f2d    |
| double | d2i i2b | d2i i2c | d2i i2s | d2i | d2l  | d2f   | ○      |

**宽化类型转换**，可能有精度损失，如long->double，但结果不会偏离太远。
**窄化类型转换**，可能造成数据溢出导致结果不正确，并有下面的规律：
- 浮点->整数
	- NaN -> 0
	- 其他 -> 向0取整 或 转换为整数能表示的最大值
- 浮点->浮点(d2f)
	- 过小 -> 0
	- 过大 -> 正负无穷大
	- NaN -> NaN

## 对象创建与访问
### 对象创建
| 创建指令           | 含义       |
|----------------|----------|
| new            | 创建类实例    |
| newarray       | 创建基本类型数组 |
| anewarray      | 创建引用类型数组 |
| multilanewarra | 创建多维数组   |

### 字段访问
| 字段访问指令              | 含义                             |
|---------------------|--------------------------------|
| getstatic、putstatic | 访问类字段（static字段，或者称为类变量）的指令     |
| getfield、 putfield  | 访问类实例字段（非static字段，或者称为实例变量）的指令 |

### 数组操作
| 数组指令    | byte(boolean) | char    | short   | long    |
|---------|---------------|---------|---------|---------|
| xaload  | baload        | caload  | saload  | iaload  |
| xastore | bastore       | castore | sastore | iastore |

### 类型检查指令
| 类型检查指令     | 含义               |
|------------|------------------|
| instanceof | 判断给定对象是否是某一个类的实例 |
| checkcast  | 检查类型强制转换是否可以进行   |

- 指令instanceof用来判断给定对象是否是某一个类的实例，它会将判断结果压入操作数栈
- 指令checkcast用于检查类型强制转换是否可以进行。如果可以进行，那么checkcast指令不会改变操作数栈，否则它会抛出ClassCastException异常

## 方法调用与返回
### 方法调用
| 方法调用指令          | 含义                                       |
|-----------------|------------------------------------------|
| invokevirtual   | 调用对象的实例方法                                |
| invokeinterface | 调用接口方法                                   |
| invokespecial   | 调用一些需要特殊处理的实例方法，包括实例初始化方法（构造器）、私有方法和父类方法 |
| invokestatic    | 调用命名类中的类方法（static方法）                     |
| invokedynamic   | 调用动态绑定的方法                                |

- invokevirtual，调用对象的实例方法，**支持多态**。
- invokespecial，调用特殊方法，静态绑定。
- invokestatic，静态绑定。
- invokedynamic，动态解析方法，并执行。该指令的分派逻辑是由用户所设定的引导方法决定的，而前面4条调用指令的分派逻辑都固化在java虚拟机内部。

{% note primary %}
invokedynamic是lambda表达式的具体底层实现，使用较少，类似于通过方法句柄调用方法，与反射不同，有点难理解，不要过度关注。
{% endnote %}

### 方法返回指令
| 方法返回指令  | void   | int     | long    | float   | double  | reference |
|---------|--------|---------|---------|---------|---------|-----------|
| xreturn | return | ireturn | lreturn | freutrn | dreturn | areturn   |

如果当前返回的是synchronized方法，那么还会执行一个隐含的monitorexit指令，退出临界区。

### 操作数栈管理
- pop，出栈
- dup，复制栈顶
	- dupm表示复制m个slot并压入栈顶
	- dupm_xn表示复制m个slot，并插入到栈顶下的（m+n）slot的位置。
- swap，交换栈顶两个slot数值，long,double不可用（占用两个slot）
- nop，占位

## 控制转移
1. 比较指令
2. 条件跳转指令
3. 比较条件跳转指令
4. 多条件分支跳转指令。
5. 无条件跳转指令等。

## 异常处理
### 指令
athrow 抛出异常或错误。将栈顶异常抛出
jsr 跳转到子例程
jsr_w 跳转到子例程（宽索引）
ret 从子例程返回

### athrow
即throw语句
在抛异常时，Java虚拟机会清除操作数栈上的所有内容，而后将异常实例压入调用者操作数栈上。


### 异常表
异常表保存了每个异常处理信息。比如：
- 起始位置
- 结束位置
- 程序计数器记录的代码处理的偏移地址
- 被捕获的异常类在常量池中的索引

### 细节
当一个异常被抛出时，JVM会在当前的方法里寻找一个匹配的处理，如果没有找到，这个方法会强制结束并弹出当前栈帧，并且异常会重新抛给上层调用的方法（在调用方法栈帧）。
如果在所有栈帧弹出前仍然没有找到合适的异常处理，这个线程将终止。如果这个异常在最后一个非守护线程里抛出，将会导致JVM自己终止，比如这个线程是个main线程。

如果有finally块，则finally块必然执行，finally块在return前执行，但不影响return的结果，因此最好不要在非finally块中使用return。

## 同步
### 同步方法
虚拟机可以从方法常量池的方法表结构中的ACC_SYNCHRONIZED访问标志得知一个方法是否声明为同步方法；不需要显式的用字节码表示。

#### 锁释放
- 如果设置了同步，执行线程将先持有同步锁，然后执行方法。最后在方法完成（无论是正常完成还是非正常完成）时释放同步锁。
- 在方法执行期间，执行线程持有了同步锁，其他任何线程都无法再获得同一个锁。
- 如果一个同步方法执行期间抛出了异常，并且在方法内部无法处理此异常，那这个**同步方法所持有的锁将在异常抛到同步方法之外时自动释放。**

### 同步代码块
jvm的指令集有monitorenter和monitorexit 两条指令来支持synchronized关键字的语义。

#### 锁释放
为了保证在方法异常完成时monitorenter和monitorexit指令依然可以正确配对执行，编译器会自动产生一个异常处理器，这个异常处理器声明可处理所有的异常，它的目的就是用来执行monitorexit指令。

# 三、类的加载过程
在Java中数据类型分为基本数据类型和引用数据类型。基本数据类型由虚拟机预先定义，引用数据类型则需要进行类的加载。
![](Pasted-image-20230201180946.png)

## 加载
### 加载过程
加载阶段，简言之，查找并加载类的二进制数据，生成Class的实例。
![](Pasted-image-20230201182105.png)
1. 通过类的全名，获取类的二进制数据流，来源有：
	- 本地文件
	- 压缩包
	- 网络
	- 数据库
	- 实时生成
2. 解析类的二进制数据流为方法区内的数据结构（Java类模型）：
	- JDK8前：永久代
	- JDK8后：元空间
3. 创建java.lang.Class类的实例（堆中），表示该类型。作为方法区这个类的各种数据的访问入口

{% note primary %}
此时Class类中的成员还没有初始化。
{% endnote %}

### 数组类的加载
**数组类本身并不是由类加载器负责创建**，而是由JVM在运行时根据需要而直接创建的。
- 因此，若数组元素是引用类型，则先加载引用类型，然后JVM自动创建其数组类型。
- 数组的访问权限由其元素类型的访问权限决定。

## 链接
### 验证
![](Pasted-image-20230201182705.png)

#### 整体说明
- **加载过程中，只进行格式检查**
- 把class文件加载到方法区后，再进行后续的检查

#### 具体说明
1. 格式验证：是否以魔数0XCAFEBABE开头，主版本和副版本号是否在当前Java虚拟机的支持范围内，数据中每一个项是否都拥有正确的长度等。
2. 语义检查：Java虚拟机会进行字节码的语义检查，但凡在语义上不符合规范的。如父类不存在，接口未实现等。
3. 字节码验证：主要检查是否有不合理的跳转，赋值，调用。（检查手段是有限的，即使通过了这阶段检查也不代表没问题。）
4. 符号引用的验证：校验器还将进符号引用的验证。Class文件在其常量池会通过字符串记录自己将要使用的其他类或者方法。因此，在验证阶段，**虚拟机就会检查这些类或者方法确实是存在的，并有访问权限**。

{% note primary %}
验证行为贯穿整个类的加载过程
- 在加载阶段进行格式检查。
- 在链接阶段的验证环节进行语义和字节码验证。
- 在链接阶段的解析环节继续拿符号引用验证。
{% endnote %}

### 准备
为类分配内存空间，并设置初始值0值。

{% note primary %}
不包含**基本数据类型的字段**用**static final**修饰的情况，因为final在编译的时候就会分配了，准备阶段会显式赋值。
此外，类变量(static)存放在**堆**中class对象中。
{% endnote %}

{% note success %}
**static与static final**
根据虚拟机规范定义，类变量（static）应该被放入方法区，而java中方法区的具体实践是：
- 类元信息放入元空间
- 字符串常量池和静态变量放入堆中，其中静态变量是伴随着Class对象分配空间的。
	- 如果静态变量是final且是基本数据类型（包括字符串），那么其值会在类加载过程中的**链接环节的准备过程**中初始化赋值，否则在这里赋0值。
	- 如果静态变量不是final且是基本数据类型（包括字符串），那么其在类加载过程中的**初始化环节**中会初始化赋值。
	- 所以，无论是否final，基本类型的static成员变量都在堆中（伴随Class对象）
{% endnote %}
例子：
```java
//根据常量池的字面量在准备阶段赋值
static final String = "Hello world"
//属于引用类型，在初始化阶段赋值
static final String str = new String("Hello world");
```


### 解析
解析阶段（Resolution），简言之，将类、接口、字段和方法的符号引用转为直接引用。
通过解析操作，符号引用就可以转变为目标方法在类中方法表中的位置，从而使得方法被成功调用。

## 初始化
### static与final的搭配问题
- 对于基本数据类型的字段来说，如果使用static final修饰，则显式赋值
- 对于String来说，如果使用字面量的方式赋值，使用static final修饰的话，则显式赋值通常是在链接阶段的准备环节进行，即`String a = "12"`形式。
- 在初始化阶段`<clinit>()`中赋值的情况： 排除上述的在准备环节赋值的情况之外的情况。

### clinit
该方法是带锁，线程安全的。只会被执行一次。

### 类的初始化情况
#### 主动使用
总之是需要使用到类的字段或方法的情况。
- 实例化
- 调用静态方法
- 获取静态字段
- 使用反射（包括**forName**）
- 继承该类
- default方法
- 包含main方法
- 被指定调用MethodHandler

#### 被动使用
除了以上情况都是被动使用，比如：
- 通过子类引用父类的静态变量，子类不会初始化。
- 数组定义，定义某种类型的数组
- 引用某个的常量static final（常量在链接的准备阶段就已经完成赋值）
- `loadClass()`也不会主动初始化。

## 卸载
**类加载器**与**被该加载器加载的类**的内部实现中，存在着双向引用。因此根据GC的原理，当某一个类的Class对象不再被引用时，即可回收，因此回收类的前提是回收其加载器。

### 类的卸载
- **启动类加载器**加载的类型在整个运行期间是**不可能被卸载的。**
- **系统类加载器和扩展类加载器**加载的类型在运行期间**不太可能被卸载**。
- 被开发者**自定义的类加载器**实例加载的类型**只有在很简单的上下文环境中才能被卸载**，而且一般还要借助于强制调用虚拟机的垃圾收集功能才可以做到。

### 卸载前提
- 所有类实例被回收
- 所有对该类的引用被回收
- 该类的加载器被回收

# 四、类加载器
## 概述
ClassLoader是Java的核心组件，所有的Class都是由ClassLoader进行加载的，ClassLoader负责通过各种方式将Class信息的二进制数据流读入JVM内部，转换为一个与目标类对应的java.lang.Class对象实例。

ClassLoader在整个装载阶段，**只能影响到类的加载，而无法通过ClassLoader去改变类的链接和初始化行为**。至于它是否可以运行，则由Execution Engine决定。

{% note primary %}
ClassLoader只定义类加载中的**加载环节的细节**。
{% endnote %}

## 基本概念
### 加载方式分类
- 显式加载：反射
- 隐式加载：JVM加载

### 命名空间
- 每个类加载器都有自己的命名空间，命名空间由该加载器及所有的父加载器所加载的类组成。
- 在同一命名空间中，不会出现类的完整名字（包括类的包名）相同的两个类
- 在不同的命名空间中，有可能会出现类的完整名字（包括类的包名）相同的两个类

**类的唯一性：由加载器和该类共同决定其唯一性。**

### 基本特征
- 可见性，子加载器可以看见父加载器加载的类型，反之则不行。
- 单一性，由于可见性，父加载器加载的类不会被子加载器重复加载。

## 加载器分类
- 引导类加载器（Bootstrap ClassLoader）
- 自定义类加载器（User-Defined ClassLoader）

加载器之间不是继承关系，而是**包含关系**，子加载器包含父加载器的引用，因此其可以看见父加载器加载的内容（可见性），以及调用父加载器（实现双亲委派机制）。

### 引导类加载器
#### 启动类加载器（Bootstrap ClassLoader）
- C/C++实现，在JVM内部实现
- 加载核心库
- 没有父加载器

### 自定义加载器
#### 扩展类加载器（Extension ClassLoader）
- Java语言编写，由sun.misc.Launcher$ExtClassLoader实现。
- 加载ext.dirs目录下的类库
- 父类加载器为启动类加载器
- 直接继承于URLClassLoader，最终继承于ClassLoader类（一个抽象类）

#### 系统类加载器（AppClassLoader）
- java语言编写，由sun.misc.Launcher$AppClassLoader实现
- 它负责加载环境变量classpath或系统属性java.class.path 指定路径下的类库
- 父类加载器为扩展类加载器
- 直接继承于URLClassLoader，最终继承于ClassLoader类（一个抽象类）

#### 用户自定义加载器
可以通过自定义实现插件机制，此外加载器可以实现应用隔离。

## 源码
### ClassLoader主要方法
ClassLoader是一个抽象类，基本java实现的加载器都继承自它。
其有以下方法：
```java
public final ClassLoader getParent()
//加载
public Class<?> loadClass(String name) throws ClassNotFoundException
protected Class<?> findClass(String name) throws ClassNotFoundException
//链接
protected final void resolveClass(Class<?> c)
```

- 其中，`loadClass()`会调用`findClass()`，而loadClass中实现了双亲委派机制，因此自定义加载器时，尽量只重写findClass()及其调用的方法。
- `findClass()`会调用`defineClass()`，其指明如何将byte流解析成Class对象。


### SecureClassLoader与URLClassLoader
- SecureClassLoader继承并扩展了ClassLoader功能，添加了权限认证。
- URLClassLoader继承并扩展了SecureClassLoader，其对ClassLoader中的许多抽象方法做了具体的实现。
- 一般自定义加载类直接继承URLClassLoader非常方便。

### ExtClassLoader与AppClassLoader
- JDK8中，这两个类都继承自URLClassLoader
- JDK9中，这两个类都继承自BuiltinClassLoader

### Class.forName()与ClassLoader.loadClass()
- 前者会初始化，后者不会。
- 后者需要指定一个具体的加载器加载。

## 双亲委派模型
### 定义
先交给父类加载器加载，加载失败再由子类加载。
![](Pasted-image-20230202001557.png)

### 特点
#### 过程
1. 搜索类，有则返回
2. 有父类则委托加载
3. 无父类则使用引导类加载器加载（必须委托一次引导类，实现保护的核心API的功能）
4. 都失败则主动加载

#### 优点
- 避免重复加载
- 保护核心类库

#### 缺点
- 顶层无法访问底层加载器，系统类无法访问应用类，无法在系统类的方法中调用应用类。

{% note primary %}
由于Java虚拟机规范并没有明确要求类加载器的加载机制一定要使用双亲委派模型，只是建议采用这种方式而已。
{% endnote %}

### 破坏双亲委派机制
#### 第一次：覆盖loadClass
双亲委派机制推出前就有ClassLoader存在，loadClass方法已经被用户使用自定义加载器覆盖（没有双亲委派），后来才推荐用户改写findClass。

#### 第二次：线程上下文类加载器
解决系统类无法调用用户类的缺点，如JNDI服务就需要调用，管理用户类。

##### 设置
如果创建线程时还未设置，它将会从父线程中继承一个，如果在应用程序的全局范围内都没有设置过的话，那这个类加载器默认就是应用程序类加载器。
![](Pasted-image-20230202002835.png)
父类加载器可以通过线程上下文类加载器委托给子类加载器完成类的加载。这样以上下文加载器为中介，使得启动类加载器中的代码也可以访问应用类加载器中的类。

#### 第三次：用户的要求
第三次破坏源于用户需求：代码热替换(Hot Swap)、模块热部署(Hot Deployment)等。

背景：IBM公司主导的JSR-291(即OSGiR4.2)实现模块化热部署的关键是它自定义的类加载器机制的实现，每一个程序模块(osGi中称为Bundle)都有一个自己的类加载器，当需要更换一个Bundle时，就把Bund1e连同类加载器一起换掉以实现代码的热替换。在oSGi环境下，类加载器不再双亲委派模型推荐的树状结构，而是进一步发展为更加复杂的网状结构。

搜索顺序：
1. java.开头，委托父类（双亲）
2. 若在委派列表名单中，委托父类（双亲）
3. 在各种列表中寻找类加载器进行加载（平行）

PS：了解一下就行。

### 热替换的实现
![](Pasted-image-20230202003613.png)

## 沙箱安全机制
Java安全模型的核心就是Java沙箱。即将Java代码限定在虚拟机（JVM）特定的运行范围中，并且严格限制代码对本地系统资源（CPU、内存、文件系统、网络）访问。

### JDK1.0
![](Pasted-image-20230202003843.png)

### JDK1.1
增加了**安全策略**。允许用户指定代码对本地资源的访问权限。
![](Pasted-image-20230202003849.png)

### JDK1.2
改进了安全机制，增加了**代码签名**。由**类加载器**加载到虚拟机中权限不同的运行空间，来实现差异化的代码执行权限控制。
![](Pasted-image-20230202003938.png)

### JDK1.6
虚拟机会把所有代码加载到不同的系统域和应用域。

系统域专门负责与关键资源进行交互，而各个应用域部分则通过系统域的部分代理来对各种需要的资源进行访问。

![](Pasted-image-20230202003950.png)

## 自定义类加载器
### 目的
- 隔离加载类（容器隔离）
- 修改类的加载方式（动态加载）
- 扩展加载源（数据库，网络）
- 防止源码泄漏（加密）

### 实现方式
方式
- 方式一:重写loadClass()方法
- 方式二:重写findclass()方法，推荐
说明
- 其父类加载器是系统类加载器

## Java9新特性
1. 扩展机制被移除，扩展类加载器由于向后兼容性的原因被保留，不过被重命名为平台类加载器(platform class loader)。可以通过classLoader的新方法getPlatformClassLoader()来获取。
2. 平台类加载器和应用程序类加载器都不再继承自java.net.URLClassLoader。现在启动类加载器、平台类加载器、应用程序类加载器全都继承于jdk.internal.loader.BuiltinClassLoader。

![](https://img-blog.csdnimg.cn/img_convert/323cfcda53f98034ed15372c0ea43685.png)
3. 在Java9中，类加载器有了名称。该名称在构造方法中指定，可以通过getName()方法来获取。平台类加载器的名称是platform，应用类加载器的名称是app。类加载器的名称在调试与类加载器相关的问题时会非常有用。
4. 启动类加载器现在是在jvm内部和java类库共同协作实现的类加载器（以前是C++实现），但为了与之前代码兼容，在获取启动类加载器的场景中仍然会返回null，而不会得到BootClassLoader实例。
5. 类加载的委派关系也发生了变动。当平台及应用程序类加载器收到类加载请求，在委派给父加载器加载前，要先判断该类是否能够归属到某一个系统模块中，如果可以找到这样的归属关系，就要优先委派给负责那个模块的加载器完成加载。

![](Pasted-image-20230202004846.png)
{% note primary %}
总结就是：
1. ext改名plat
2. 新增getName()方法
3. plat和app不再继承url，而是builtin
4. 引导类由java实现
5. 双亲委托前可直接判断所属系统并交付
{% endnote %}