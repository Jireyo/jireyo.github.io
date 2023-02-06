---
title: Java第1章（面向对象）
categories:
 - [八股,Java,基础]
date: 2023-01-06 19:00:55
tag:
 - Java
 - 八股
---
# 面向对象
## 面向对象的三大特性
### 封装
属性和操作分离，即通过get,set方法操作属性。

### 继承
继承实现了 **IS-A** 关系，子类可以获得父类非 private的属性和方法。

{% note primary %}
继承应该遵循**里氏替换**原则，子类对象必须能够替换掉所有父类对象。
{% endnote %}

### 多态
多态分为**编译时多态**和**运行时多态**:
- 编译时多态主要指方法的**重载**
- 运行时多态指程序中定义的对象引用所指向的具体类型在运行期间才确定

运行时多态有三个条件:
- 继承
- 覆盖(重写)
- 向上转型

>即子类要继承父类，覆盖父类的方法，并使用了父类的指针。

## 类图
### 泛化关系 (Generalization)
![](Pasted-image-20230106191817.png)
即继承父类

### 实现关系 (Realization)
![](Pasted-image-20230106191831.png)
即实现接口

### 聚合关系 (Aggregation)
![](Pasted-image-20230106191859.png)
弱依赖，整体不存在了部分也还是存在。

### 组合关系 (Composition)
![](Pasted-image-20230106191919.png)
强依赖，整体不存在了部分也不存在了。

### 关联关系（Association）
![](Pasted-image-20230106192246.png)
1对1，1对n，n对1。

### 依赖关系（Dependency）
![](Pasted-image-20230106192243.png)
A是B类的局部变量、参数，或A向B发送信息。

## 面向对象的规则
### 访问权限修饰符
Java 中有三个访问权限修饰符（四个访问权限等级）: private、protected 以及 public，如果不加访问修饰符，表示包级可见。

对**类**或类中的成员(**字段**以及**方法**)加上访问修饰符。
- 类可见表示其它类可以用这个类创建实例对象。
- 成员可见表示其它类可以用这个类的实例对象访问到该成员；

对于**类**：只有public和defualt修饰符
对于**成员**：4种访问等级都有，protected表示**本包和子类**可见

### 关键字
#### final
1.修饰数据
表示数据为不可改变，其只针对编译期检查，运行时会抹去。
- 对于基本类型，final 使数值不变；
- 对于引用类型，final 使引用不变。

2.修饰类
表示类不可继承

3.修饰方法
表示不可重写

#### static
1.静态变量
静态变量就是类变量
2.静态方法
类加载时就存在，必须实现，不可为抽象方法，也只能访问所属类的静态变量和静态方法
3.静态代码块
见代码块，类初始化时运行
4.静态内部类
不依赖外部实例的静态类（内部类本质上是一个单独的class文件）

### 对象构造
一个类至少有一个构造器，如果显示定义了构造器，系统默认的无参构造器会失效。
### 代码块
代码块分：
- 普通代码块：类的方法体
- 构造代码块：即类中的{}
- 静态代码块：即类中的static {}

{% note primary %}
静态代码块是类加载时执行的，只会在第一次new时执行一次，是类的初始化
构造代码块是每新建一个实例都会执行一次，是对象的初始化
{% endnote %}
### 初始化顺序
新建对象调用顺序：
静态代码块（只会调用一次）-> 构造代码块 -> 构造器

因此属性的赋值：
- 静态初始化（静态赋值和静态代码块按照执行顺序）
- 默认初始化（0,false）
- 构造初始化（普通赋值和构造代码块按执行顺序）
- 构造函数

存在继承时：
1. 父类静态、子类静态
2. 父类构造初始化、父类构造函数
3. 子类构造初始化、子类构造函数

{% note primary %}
静态变量是可以不赋初值的，所以当其被声明时，会先赋予默认值，后续再初值。
{% endnote %}

### 继承
#### 抽象类与接口
##### 抽象类
抽象类和抽象方法一定使用 abstract 关键字进行声明。
很容易理解：
- 抽象类不能被实例化
- 抽象方法不能出现在非抽象类中

##### 接口
接口在Java 8之前是纯抽象类，在JAVA8之后其允许默认的方法实现。
- 接口的成员，字段都默认（且必须）是Public的
- 接口的字段默认是static final的

##### 比较
抽象类是IS-A关系，接口是LIKE-A关系

##### 使用
接口：多重继承，主要用于表示实现类拥有具体方法。
抽象类：主要用于在相关类中共享代码。
优先使用接口
#### super字段
- super()
父类的构造函数，如果子类使用必须放在子类构造函数的第一排

#### this字段
在方法中，this指方法所属对象（static方法里不能有this）
在构造函数中，this指正在初始化的对象

#### 重写
重写限制（里氏原则）：
- 子类方法访问权限大于父类
- 子类方法返回值为父类返回值或其子类
@Override会对以上限制进行检查。

#### 重载
同一个方法的参数：个数，类型，顺序至少一个不同

### 内部类
内部类也都是独立的类，均有单独的class文件，但前面会有外部类的类名和$符
分类：
- 成员内部类
	- 静态内部类
	- 非静态内部类
- 局部内部类、匿名内部类
#### 成员内部类
作为成员：
- 成员内部类可以声明为private或protected，可以调用外部内的结构
- 如果是static的成员内部类，可以脱离父类实例存在，因此也只能使用父类静态成员。
作为类：
可以声明为abstract被其他内部类继承，也可以声明为final禁止继承

{% note primary %}
不存在静态的外部类，因为这没有意义，外部类的成员只要标注为static就能任意使用。
而内部类可以标注为静态，表示其可以脱离父实例而存在，因此若内部类需要再使用static成员，其类本身也必须为static，才可以任意使用。
{% endnote %}

#### 局部内部类
即在方法中声明一个内部类，声明后在只能在方法体内使用。
（但可以在方法最后返回这个内部类实例，不过返回值应该设置为该内部类的父类或父接口，毕竟外部不认识该局部内部类）

其可以使用外部类的成员（包括私有的）、外部方法的局部变量，但必须是final修饰的

因为是一个局部的，短暂的类，所以其与局部变量类似，不存在修饰符，也不能为静态类或拥有静态成员。

#### 匿名内部类
匿名内部类必须继承父类或实现接口，其只有一个对象，只能多态引用。
```java
new ParentClass|ParentInterface(){
	public void fun1(){
		System.out.println("hello")
	}
}
```
{% note primary %}
局部内部类是主要用于在一个方法中，我们短暂的需要一个结构体来处理问题时使用；而如果我们明确只需要一个具体的函数，但不想为此创造一个新类，且这个函数已经有明确的父类或接口，我们则可以让局部内部类退化为匿名内部类实现这个方法即可。
同样，匿名内部类的方法也可以使用外部的变量，但外部的变量必须是final修饰的：
匿名内部类，之所以能够使用外部变量，是因为其底层将外部变量作为构造参数传入了匿名内部类，问题的核心在于，如果不声明外部变量为final，当外部变量变化时，匿名内部类无法感知这个变化，可能会导致数据的不一致问题。实际上，JDK8中我们不再需要显示的将外部变量声明为final，其实底层还是为我们加上了final（语法糖）。
不过回到final的知识点，读写final字段对于JVM而言，主要是在编译器起限制重排序的作用，详情见JUC。
{% endnote %}

{% note primary %}
匿名内部类是lambda表达式的原型，因此也很好理解为声明lambda表达式只能使用final变量
{% endnote %}
### Object
#### 通用方法
- equals()
默认为比较对象是否等价，需要满足对称等性质。
`==`则判断值（基本类型或指针）是否相等。 
- hashCode()
默认：是一个native方法，返回int，使用的是对象的地址（引用地址）进行计算。
其可以被覆盖（String,Integer等都覆盖了这个方法）。对于两个对象，如果equals返回true,其hashCode()必须相等，因此覆盖equals时总是应该覆盖hashCode方法。
- toString()
默认返回对象类型+@+16进制的hashCode()
- clone()
clone()是一个native,protected方法
>因为clone修饰符为protected，其只对本包和其子类可见，对于自定义类1，2
>在类1中调用类2的clone()，Object的默认clone只对类2可见，对类1不可见，所以要重写，一般重写为 return (T)super.clone()

另外，一个类要使用clone()方法，必须先继承Cloneable接口，并重写clone()，且要抛出CloneNotSupportedException异常。

另外，克隆也有浅拷贝和深拷贝，native的clone()只能获得一个对象的**浅拷贝**，对象的属性（引用类型）仍相同。想要获得**深拷贝**，需要在重写中实现。

替代方案，clone()既复杂又危险，可以使用拷贝构造函数或者拷贝工厂来拷贝一个对象。
```java
//拷贝构造函数
public CloneConstructorExample(CloneConstructorExample original) {
        arr = new int[original.arr.length];
        for (int i = 0; i < original.arr.length; i++) {
            arr[i] = original.arr[i];
        }
    }
```

## 枚举类
类的对象有限且确定时可以使用枚举。
- enum定义的枚举类默认继承了java.lang.Enum类。
- 枚举类的构造器只能使用 private 权限修饰符。
- 必须在枚举类的第一行声明枚举类对象
具体使用：
```java
enum Color 
{ 
    RED, GREEN, BLUE; 
}
//实际使用中，有一种获取静态变量的感觉
Color.RED

//通用方法和字段
enum Color {
    RED("红色", 1), GREEN("绿色", 2), BLANK("白色", 3), YELLO("黄色", 4);  
    // 成员变量  
    private String name;  
    private int index;  
    // 构造方法  
    private Color(String name, int index) {  
        this.name = name;  
        this.index = index;  
    }  
    // 普通方法  
    public static String getName(int index) {  
        for (Color c : Color.values()) {  
            if (c.getIndex() == index) {  
                return c.name;  
            }  
        }  
        return null;  
    }
	get,set...
}
//也可以声明抽象方法并在所有枚举中实现
enum Color{
    RED{
        public String getColor(){//枚举对象实现抽象方法
            return "红色";
        }
    },
    GREEN{
        public String getColor(){//枚举对象实现抽象方法
            return "绿色";
        }
    },
    BLUE{
        public String getColor(){//枚举对象实现抽象方法
            return "蓝色";
        }
    };
    public abstract String getColor();//定义抽象方法
}
```

# 其他
## JavaBean
指一个公共的，有无参公共构造其，有对应的set，get方法的，即一个标准的实体类。
## 单例模式
**私有化构造器**（外部不能new）
### 饿汉式
**类自己持有自己的实例**，通过static方法取得该实例，饿汉式表示会预加载。
```java
class Singleton{
	private Singleton(){
	}
	private static Singleton single = new Singleton();
	public static Single getInstance(){
		return single;
	}
}
```
### 懒汉式
只有调用时才加载
```java
class Singleton{
	private Singleton(){
	}
	private static Singleton single;
	public static Single getInstance(){
		if(single == null){
			return single = new Singleton();
		}else{
			return single;
		}
	}
}
```

## 代理
顾名思义，一个类A为另一个类做B代理，通过操作A来操作B
作用：
- 屏蔽真实角色
- 增强功能，如添加权限，访问控制和申计
- 延迟加载
### 静态代理
- 定义一个接口和实现类
- 定义一个代理类，实现该接口
- 将实现类注入代理类，实现代理。
```java
//代理类AdminServiceProxy与真实类AdminService继承相同的接口，即实现相同的方法
public class AdminServiceProxy implements AdminService {
	//以字段的形式持有真实对象
    private AdminService adminService;

    public AdminServiceProxy(AdminService adminService) {
        this.adminService = adminService;
    }
	//代理方法，可以在前后进行增强
    public void update() {
        System.out.println("pre");
        adminService.update();
        System.out.println("post");
    }

    public Object find() {
        System.out.println("pre1");
        System.out.println("pre2");
        return adminService.find();
    }
}
```

### 动态代理
又名JDK动态代理，使用反射实现动态代理
优点：Proxy对象不需要实现接口，即不用实现接口所有的方法。
- 定义一个接口和一个实现类
- 定义一个服务类实现`InvocationHandler`接口，并重写invoke方法。
- 通过`Proxy.newProxyInstance(ClassLoader loader,Class<?>[] interfaces,InvocationHandler h)`创建代理对象。
```java
//reflect包中的静态方法，使用类加载器（不管）、接口列表（即生成的代理对象要实现哪些方法）、和事件处理器（代理对象在原目标上要做哪些加强）生成一个新的代理对象
static Object newProxyInstance(ClassLoader loader, Class<?>[] interfaces,InvocationHandler invocationHandler );

//事件处理器，主要用来写增强的内容
public class AdminServiceInvocation  implements InvocationHandler {

    private Object target;

    public AdminServiceInvocation(Object target) {
        this.target = target;
    }

    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("判断用户是否有权限进行操作");
       Object obj = method.invoke(target);
        System.out.println("记录用户执行操作的用户信息、更改内容和时间等");
        return obj;
    }
}

//代理类，通过传入 增强器 和 代理目标，生成代理对象,后续可根据这个该代理类实体获取代理对象。
public class AdminServiceDynamicProxy extends {
    private Object target;
    private InvocationHandler invocationHandler;
    public AdminServiceDynamicProxy(Object target,InvocationHandler invocationHandler){
        this.target = target;
        this.invocationHandler = invocationHandler;
    }

    public Object getPersonProxy() {
        Object obj = Proxy.newProxyInstance(target.getClass().getClassLoader(), target.getClass().getInterfaces(), invocationHandler);
        return obj;
    }
}
```
>即通过反射的invoke方法，执行目标对象的目标方法，
### Cglib代理
优点：代理目标对象没有实现接口时可使用，其会实现一个子类，实现对target对象的代理，因此target类不能为final。
>Spring 中的 AOP 模块中：如果目标对象实现了接口，则默认采用 JDK 动态代理，否则采用 CGLIB 动态代理。

- 定义一个类；
- 自定义 `MethodInterceptor` 并重写 `intercept` 方法，`intercept` 用于拦截增强被代理类的方法，和 JDK 动态代理中的 `invoke` 方法类似；
- 通过 `Enhancer` 类的 `create()`创建代理类；

```java
public class DebugMethodInterceptor implements MethodInterceptor {
    public Object intercept(Object object, Method method, Object[] arg2, MethodProxy proxy) throws Throwable {
        System.out.println("判断用户是否有权限进行操作");
        Object obj = method.invoke(target);
        System.out.println("记录用户执行操作的用户信息、更改内容和时间等");
        return obj;
    }
}

public class CglibProxyFactory {
    public static Object getProxy(Class<?> clazz) {
        // 创建动态代理增强类
        Enhancer enhancer = new Enhancer();
        // 设置类加载器
        enhancer.setClassLoader(clazz.getClassLoader());
        // 设置被代理类
        enhancer.setSuperclass(clazz);
        // 设置方法拦截器
        enhancer.setCallback(new DebugMethodInterceptor());
        // 创建代理类
        return enhancer.create();
    }
}
//使用
AliSmsService aliSmsService = (AliSmsService) CglibProxyFactory.getProxy(AliSmsService.class);
```

### 对比
#### 静态代理与动态代理
- **灵活性** ：动态代理更加灵活，不需要必须实现接口，可以直接代理实现类，并且可以不需要针对每个目标类都创建一个代理类。另外，静态代理中，接口一旦新增加方法，目标对象和代理对象都要进行修改，这是非常麻烦的！
- **JVM 层面** ：静态代理在编译时就将接口、实现类、代理类这些都变成了一个个实际的 class 文件。而动态代理是在运行时动态生成类字节码，并加载到 JVM 中的。

#### JDK 动态代理和 CGLIB 动态代理对比
- **JDK动态代理只能代理实现了接口的类或者直接代理接口，而CGLIB可以代理未实现任何接口的类。** 另外， CGLIB 动态代理是通过生成一个被代理类的子类来拦截被代理类的方法调用，因此不能代理声明为 final 类型的类和方法。
- 就二者的效率来说，大部分情况都是 JDK 动态代理更优秀，随着 JDK 版本的升级，这个优势更加明显。