---
title: Java第3章（泛型）
categories:
 - [八股,Java,基础]
date: 2023-01-08 22:22:34
tag:
 - Java
 - 八股
---
# 一、什么是泛型
## 泛型的功能
代码复用，使用一个代码流程适配多个类型。
如：
```java
private static int add(int a, int b) {
    System.out.println(a + "+" + b + "=" + (a + b));
    return a + b;
}

private static float add(float a, float b) {
    System.out.println(a + "+" + b + "=" + (a + b));
    return a + b;
}

private static double add(double a, double b) {
    System.out.println(a + "+" + b + "=" + (a + b));
    return a + b;
}
```
可以简化为：
```java
private static <T extends Number> double add(T a, T b) {
    System.out.println(a + "+" + b + "=" + (a.doubleValue() + b.doubleValue()));
    return a.doubleValue() + b.doubleValue();
}
```

## 泛型的特性
使用泛型时，我们可以具体制定此时需要适配的类型，然后**编译器**会根据此进行类型检查，约束编码。

# 二、泛型的基本使用
## 泛型类
创建该类的对象的时候可以制定泛型的具体类型，其方法也会适配。
如：
```java
class Point<T>{         // 此处可以随便写标识符号，T是type的简称  
    private T var ;     // var的类型由T指定，即：由外部指定  
    public T getVar(){  // 返回值的类型由外部决定  
        return var ;  
    }  
    public void setVar(T var){  // 设置的类型也由外部决定  
        this.var = var ;  
    }  
}  
public class GenericsDemo01{  
    public static void main(String args[]){  
        Point<String> p = new Point<String>() ;     // 里面的var类型为String类型  
        p.setVar("it") ;                            // 设置字符串  
        System.out.println(p.getVar().length()) ;   // 取得字符串的长度  
    }  
}
```

也可以使用多元泛型<A,B>
```java
class Notepad<K,V>{       // 此处指定了两个泛型类型  
    private K key ;     // 此变量的类型由外部决定  
    private V value ;   // 此变量的类型由外部决定  
    public K getKey(){  
        return this.key ;  
    }  
    public V getValue(){  
        return this.value ;  
    }  
    public void setKey(K key){  
        this.key = key ;  
    }  
    public void setValue(V value){  
        this.value = value ;  
    }  
}
```
{% note primary %}
不要惧怕`<>`，其就是一个用来传参的窗口，类似与方法中在`()`写入多个参数，泛型则是在**类/接口的创建**或**方法的使用**时，传入类型的参数`<type1,type2>`，从而令类型、方法等具体化。
{% endnote %}

## 泛型接口
可见定义接口和定义类类似，在实现该接口时，也应该使用泛型。
```java
interface Info<T>{        // 在接口上定义泛型  
    public T getVar() ; // 定义抽象方法，抽象方法的返回值就是泛型类型  
}  
class InfoImpl<T> implements Info<T>{   // 定义泛型接口的子类  
    private T var ;             // 定义属性  
    public InfoImpl(T var){     // 通过构造方法设置属性内容  
        this.setVar(var) ;    
    }  
    public void setVar(T var){  
        this.var = var ;  
    }  
    public T getVar(){  
        return this.var ;  
    }  
} 
```

## 泛型方法
一个非泛型类里面也可以有泛型方法，泛型方法的目的也是可以对一个泛型方法传入多种类型的参数，而不需要new很多泛型类来实现。
同时，泛型方法就是为了适配不同类型的参数，所以一般在声明方法时，型参的类型也是一个泛型类，如下面的`Class<T>`。

此时泛型的类别应该在调用该方法时，通过参数？todo或其他方式，指明类型。
```java
public <T> T getObject(Class<T> c) throws Exception{
	T t = c.newInstance();
	return t;
}

Clazz clazz1 = new Clazz();
Object obj = clazz1.getObject(Class.forName("com.cnblogs.test.User"));
```
- 泛型方法需要在修饰符后面加上`<T>`来标识这是一个泛型方法。
- 泛型方法需要使用泛型类型的型参来，使用时传入具体的泛型类型来适配。

## 普通方法
普通方法使用泛型，该方法不属于泛型方法，参数是泛型类，且已经制定了具体的泛型类的方法：
```java
public int max getSum(List<Integer> list){};
```

## 泛型的上下限
泛型有一个问题，即
- Even `A extends B` but `List<A>  not extends List<B>`
假如，现在有一个普通方法，参数是一个泛型类型
```java
public int max getSum(List<B> list){};
```
如果传入一个`List<A>`则会出现报错。

### 解决
使用上下边界机制解决,如：
#### 泛型方法
```java
//上限
public int max getSum(List<? extends B> list){};
//下限
public static void fun(Info<? super String> temp){};
```
#### 泛型类
```java
//上限
class Info<T extends Number>{    // 此处泛型只能是数字类型
    private T var ;        // 定义泛型变量
    public void setVar(T var){
        this.var = var ;
    }
    public T getVar(){
        return this.var ;
    }
    public String toString(){    // 直接打印
        return this.var.toString() ;
    }
}
```

{% note primary %}
泛型上下限使用上下限 限制了 泛型的**具体类型**，此时注意`？`才是真正的泛型类型。
具体使用时，
- 如果该 类/方法 是对 界限类型T的生产者，则使用`<? extends T>`，即在类/方法中有类似T t = new B(实际传入的类型)，这类**生产T**的操作。即可以创造一个`List<? extends Fruit>`，然后我们可以通过getNode()，来确保我们能获取一个Fruit。
- 如果该 类/方法 是对 界限类型T的消费者，则使用`<? super T>`，即在类/方法中有类似 addNode(T t)，这类**消费T**的操作。一般用于泛型类当中，即可以创造一个`List<? super Apple>`，这样就知道往这个集合里add Apple或其子类肯定是可行的，因为Apple及其子类肯定也是`？`具体类型的子类。

所以，上限确保我们可以得到一个具体类型**T**的引用（生产），下限确保我们可以往类型/方法中消耗**T**(消费)。
{% endnote %}

{% note primary %}
- 在具体的泛型类/泛型方法的**声明**中，一般使用`T`或`T extends Clazz`声明泛型，然后使用**T**进行操作。
- 在具体的普通引用/普通方法的参数**声明**中，一般使用`List<?>`或`List<? extends Clazz>`，对传入的泛型对象的具体类型的限制。
{% endnote %}

#### 多限制
```java
<T extends Staff & Passenger>
```

#### 泛型数组
```
List<String>[] list14 = new ArrayList<String>[10]; //编译错误
List<String>[] list13 = (List<String>[]) new ArrayList<?>[10]; //OK，但是会有警告 
List<?>[] list14 = new ArrayList<String>[10]; //编译错误
List<?>[] list15 = new ArrayList<?>[10]; //OK
```

# 加深理解
### 泛型擦除
Java泛型的实现采取了“**伪泛型**”的策略，即Java在语法上支持泛型，但是在编译阶段会进行所谓的“**类型擦除**”（Type Erasure）。
{% note primary %}
回到本质，java泛型本质是为了复用代码，泛型则用于在编码时限制，编译时会对其进行擦除。
{% endnote %}

具体操作：
- T和？和? super Clazz都替换为Object
![](Pasted-image-20230109011238.png)
- T extends Clazz/? extends Clazz替换为Clazz
![](Pasted-image-20230109011241.png)

### 泛型方法
- 在不指定泛型的情况下，泛型变量的类型为该方法中的几种类型的同一父类的最小级，直到Object
```java
int i = Test.add(1, 2); //这两个参数都是Integer，所以T为Integer类型  
Number f = Test.add(1, 1.2); //这两个参数一个是Integer，一个是Float，所以取同一父类的最小级，为Number  
Object o = Test.add(1, "asd"); //这两个参数一个是Integer，一个是String，所以取同一父类的最小级，为Object
```
- 在指定泛型的情况下，该方法的几种类型必须是该泛型的实例的类型或者其子类
```java
int a = Test.<Integer>add(1, 2); //指定了Integer，所以只能为Integer类型或者其子类  
int b = Test.<Integer>add(1, 2.2); //编译错误，指定了Integer，不能为Float  
Number c = Test.<Number>add(1, 2.2); //指定为Number，所以可以为Integer和Float 
```

### 编译期检查
Java编译器是通过先检查代码中泛型的类型，然后在进行类型擦除，再进行编译。

类型检查就是针对引用的，谁是一个引用，用这个引用调用泛型方法，就会对这个引用调用的方法进行类型检测，而无关它真正引用的对象，即：
```java
ArrayList<String> list1 = new ArrayList();  
list1.add("1"); //编译通过  
list1.add(1); //编译错误  

ArrayList list2 = new ArrayList<String>();  
list2.add("1"); //编译通过  
list2.add(1); //编译通过
```

### 泛型多态
类型擦除会导致多态冲突，如继承一个具体泛型类
```java
class DateInter extends Pair<Date> {  

    @Override  
    public void setValue(Date value) {  
        super.setValue(value);  
    }  

    @Override  
    public Date getValue() {  
        return super.getValue();  
    }  
}
```
如我们希望通过继承**具体泛型**来重写具有**具体参数**和**具体返回值**的方法，但父类由于类型擦除，参数会变成Object。导致与重写发生定义冲突。

此时，JVM会使用桥方法解决问题，以下为字节码
```java
class com.tao.test.DateInter extends com.tao.test.Pair<java.util.Date> {  
  com.tao.test.DateInter();  
    Code:  
       0: aload_0  
       1: invokespecial #8                  // Method com/tao/test/Pair."<init>":()V  
       4: return  

  public void setValue(java.util.Date);  //我们重写的setValue方法  
    Code:  
       0: aload_0  
       1: aload_1  
       2: invokespecial #16                 // Method com/tao/test/Pair.setValue:(Ljava/lang/Object;)V  
       5: return  

  public java.util.Date getValue();    //我们重写的getValue方法  
    Code:  
       0: aload_0  
       1: invokespecial #23                 // Method com/tao/test/Pair.getValue:()Ljava/lang/Object;  
       4: checkcast     #26                 // class java/util/Date  
       7: areturn  

  public java.lang.Object getValue();     //编译时由编译器生成的桥方法  
    Code:  
       0: aload_0  
       1: invokevirtual #28                 // Method getValue:()Ljava/util/Date 去调用我们重写的getValue方法;  
       4: areturn  

  public void setValue(java.lang.Object);   //编译时由编译器生成的桥方法  
    Code:  
       0: aload_0  
       1: aload_1  
       2: checkcast     #26                 // class java/util/Date  
       5: invokevirtual #30                 // Method setValue:(Ljava/util/Date; 去调用我们重写的setValue方法)V  
       8: return  
}
```
编译器通过生成桥方法（Object作为参数和返回值等），实现对父类方法的重写，然后在其中调用我们真正重写的方法。
另外，桥方法getValue()看似和我们重写的getValue()冲突，但实际上JVM允许自己通过参数类型和返回类型共同确定一个方法。

### 基本类型不能作为泛型类型
ArrayList的原始类型变为Object，但是Object类型不能存储int值，只能引用Integer的值。

### 泛型类型不能实例化
编译期找不到对应的类字节码文件，无法确认具体泛型类型。
```java
T test = new T(); // ERROR

//解决，利用反射
static <T> T newTclass (Class < T > clazz) throws InstantiationException, IllegalAccessException {
    T obj = clazz.newInstance();
    return obj;
}
```

### 泛型数组不能初始化
```java
List<String>[] lsa = new List<String>[10];
Object[] oa = (Object[]) lsa;
List<Integer> li = new ArrayList<Integer>();
li.add(new Integer(3));
oa[1] = li; // Correct.
String s = lsa[1].get(0); // Error，Class

//如果对lsa进行强转Object[]，就可以对其添加其他list，导致Class错误，因此要避免这样的情况发生：

List<?>[] lsa = new List<?>[10]; // OK, array of unbounded wildcard type.
Object[] oa = (Object[]) lsa;
List<Integer> li = new ArrayList<Integer>();
li.add(new Integer(3));
oa[1] = li; // Correct.
Integer i = (Integer) lsa[1].get(0); // OK
//因为使用？来创建类型，所以array本身的定位就是可以放入不同的list，最后取出时强转，符合逻辑
```

### PS数组类型
**数组类可以分类可以分成两类：**
- 基本类型的数组类；
- 引用类型的数组类；
基本类型的数组类的父类是Object，即`int[]`可以强转`Object`
引用类型的数组类的父类有`Object`，`Object[]`，`Parent[]`，即如果A extends B，A可以强转`Object`，`Object[]`，`Parent[]`。

### 泛型数组如何正确初始化
最好使用列表集合对其替换。或者通过反射建立，因为反射时，类型已经被确认。

### 如何理解泛型类中的静态方法和静态变量
泛型类中的静态方法和静态变量**不可以**使用泛型类所声明的泛型类型参数，显然当静态变量建立时，具体类型还未确认。

### 如何理解异常中使用泛型
- 不能**捕获**泛型类型的异常。（编译器禁止）
	- 由于类型抹去，捕获泛型类型会失效，也可能导致多个catch句子中的父子类顺序混淆
```java
public static <T extends Throwable> void doWork(Class<T> t) {
    try {
        ...
    } catch(T e) { //编译错误
        ...
    } catch(Problem<Integer> e1){ //Integer会抹去，无法捕获
	    ...
    } catch(IndexOutOfBounds e) {
		...
    }
}
```
- 但可以在方法声明中使用泛型并抛出。
```java
public static<T extends Throwable> void doWork(T t) throws T {
    try{
        ...
    } catch(Throwable realCause) {
        t.initCause(realCause);
        throw t; 
    }
}
```
{% note primary %}
由于泛型本质上是为了简化类型转换问题和约束编程，在编译时会进行类型抹去。而catch操作是一个运行时发生的事件，**需要catch具体的类型**，其抹去类型后，与catch的捕获异常的**范围和先后顺序**产生矛盾。
但通过限制泛型异常上界，并**捕获其上界**，对其进行抛出是可行的。
{% endnote %}

### 如何获取泛型参数
**Type**是Java所有类型实现的**公共接口**。
```java
GenericType<String> genericType = new GenericType<String>() {};
Type superclass = genericType.getClass().getGenericSuperclass();
//getActualTypeArguments 返回确切的泛型参数, 如Map<String, Integer>返回[String, Integer]
Type type = ((ParameterizedType)superclass).getActualTypeArguments()[0]; 
System.out.println(type);//class java.lang.String
```
