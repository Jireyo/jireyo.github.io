---
title: Java第4章（注解、异常、反射）
categories:
 - [八股,Java,基础]
date: 2023-01-09 16:34:34
tag:
 - Java
 - 八股
---
# 一、注解
## 注解的作用
- **生成文档**，通过代码里标识的元数据生成javadoc文档。
- **编译检查**，通过代码里标识的元数据让编译器在编译期间进行检查验证。
- **编译时动态处理**，编译时通过代码里标识的元数据动态处理，例如动态生成代码。
- **运行时动态处理**，运行时通过代码里标识的元数据动态处理，例如使用反射注入实例。
## 元注解
元注解就是注解的注解，一般用于标识注解的属性
### @Target
描述注解的使用范围，即可以在哪些对象上使用注解（常见的有TYPE,FILED,METHOD）等等。
### @Retention & @RetentionTarget
描述注解的保留时间（注意这里是指被保留到什么时候）有（SOURCE,CLASS,RUNTIME）三种策略。
### @Document
被其修饰的注解在标记在 其他对象上后，使用 javadoc 工具为类生成帮助文档时**会保留其注解信息**。
### @Inherited
被其修饰的注解是否有继承性，如某类使用注解A，其子类也会继承注解A
### @Reaptable
描述注解是否可以重复使用，即在一个对象上多次标注（但使用不同的参数）
### @Native
被其修饰的**成员变量**可以被本地方法引用，使用较少。

## 内置注解
### @Override
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.SOURCE)
public @interface Override {
}
```
作用：**编译检查**，会检查是否按规范重写了父类方法。
### @Deprecated
```java
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(value={CONSTRUCTOR, FIELD, LOCAL_VARIABLE, METHOD, PACKAGE, PARAMETER, TYPE})
public @interface Deprecated {
}
```
作用：表示这个对象已经过时。

### @SuppressWarnings
```java
@Target({TYPE, FIELD, METHOD, PARAMETER, CONSTRUCTOR, LOCAL_VARIABLE})
@Retention(RetentionPolicy.SOURCE)
public @interface SuppressWarnings {
    String[] value();
}
```
关闭编译器警告,可传入`String[]`著名需要抑制的警告类型。

## 注解与反射接口
如何获取注解信息？
通过反射即可获取，如：
```java
<T extends Annotation> T getAnnotation(Class<T> annotationClass)

Annotation[] getAnnotations()
```

## 自定义注解
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface MyMethodAnnotation {

    public String title() default "";

    public String description() default "";

}
```

## 深入理解注解
### JDK8新注解
- @Repeatable
- 新的Target参数`ElementType.TYPE_PARAMETER`，包括type和parameter。
### 注解不支持继承
注解之间无法继承，但编译后统一继承`java.lang.annotation.Annotation`
### 注解实现原理
- 注解是一个继承自Annotation的接口，里面每一个属性其实是一个接口的抽象方法。
- 使用注解时，会创建一个注解实例对象，该对象是通过jdk动态代理生成的（在`AnnotationInvocationHandler()`方法中就封装了代理的逻辑）

### 注解引用场景
#### 框架
框架从配置化 -> 注解化
#### AOP
AOP实现统一日志管理，实现模块的解偶。
具体就是以@Log为切点，然后对方法进行增强。


# 二、异常
## 异常基础
Java异常是Java提供的一种识别及响应错误的一致性机制。
![](Pasted-image-20230109184839.png)
### Error
Error是JVM无法处理的错误。

### Exception
- Exception是可以被捕获，处理的异常。分为两类：运行时异常和编译时异常。
- 运行时异常（不会检查的）：NullPointerException,IndexOutOfBoundsException
- 非运行时异常（必须处理的）：IOException、SQLException。


### 可检查异常和不可检查异常
除了Error，RuntimeException及其子类，其他都是可检查异常，需要在编写程序时对其进行解决。

### 异常使用
- **finally** – finally语句块总是会被执行。它主要用于回收在try块里打开的物力资源(如数据库连接、网络连接和磁盘文件)。如果try,catch中有return或throw，会先执行完finally再回去执行返回行为（return/throw），如果finally中有返回行为，则不会再回去执行。finally可以脱离catch使用。
- **throw** – 用于**抛出**异常。
- **throws** – 用在方法签名中，用于声明该方法**可能抛出**的异常。

#### throws
必须声明方法可抛出的任何可查异常（checked exception）。

#### throw
大部分情况下都不需要手动抛出异常，因为Java的大部分方法要么已经处理异常，要么已声明异常。所以一般都是捕获异常或者再往上抛。有时会在catch中抛出另一个异常，主要是为了封闭异常细节。

#### 自定义
继承Exception即可，习惯上要定义无参和具有描述信息的构造函数。

### try-with-resource
JAVA7中引入，会自动关闭资源。需要该资源实现了AutoCloseable接口。
```java
try (Scanner scanner = new Scanner(new FileInputStream("c:/abc"),"UTF-8")){
	// code
} catch (IOException e){
	// handle exception
}
```

## 深入理解
### 异常表
JVM处理异常的机制涉及Exception Table，以下称为异常表。
```java
public static void simpleTryCatch();
    Code:
       0: invokestatic  #3                  // Method testNPE:()V
       3: goto          11
       6: astore_0
       7: aload_0
       8: invokevirtual #5                  // Method java/lang/Exception.printStackTrace:()V
      11: return
    Exception table:
       from    to  target type
           0     3     6   Class java/lang/Exception
```

异常表按**catch顺序**记录的异常捕获信息，包括：
- **from** 可能发生异常的起始点
- **to** 可能发生异常的结束点
- **target** 上述from和to之前发生异常后的异常处理者的位置
- **type** 异常处理者处理的异常的类信息

### finally
```java
public static void simpleTryCatchFinally();
    Code:
       0: invokestatic  #3                  // Method testNPE:()V
       3: getstatic     #6                  // Field java/lang/System.out:Ljava/io/PrintStream;
       6: ldc           #7                  // String Finally
       8: invokevirtual #8                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
      11: goto          41
      14: astore_0
      15: aload_0
      16: invokevirtual #5                  // Method java/lang/Exception.printStackTrace:()V
      19: getstatic     #6                  // Field java/lang/System.out:Ljava/io/PrintStream;
      22: ldc           #7                  // String Finally
      24: invokevirtual #8                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
      27: goto          41
      30: astore_1
      31: getstatic     #6                  // Field java/lang/System.out:Ljava/io/PrintStream;
      34: ldc           #7                  // String Finally
      36: invokevirtual #8                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
      39: aload_1
      40: athrow
      41: return
    Exception table:
       from    to  target type
           0     3    14   Class java/lang/Exception
           0     3    30   any
          14    19    30   any
```
一个finally会产生两个捕获表条目，表示try或catch中发送任何异常其都可以捕获并跳转到30执行。
如果方法有返回值，为了保证finally执行，会在编译时将finally中内容编译在return语句前。

# 反射
### 基本概念
- Class类也是一个类，不同的类都有一个Class类的实体存在于堆中。
- Class类只存私有构造函数，因此对应Class对象只能有JVM创建和加载
- Class类的对象作用是运行时提供或获得某个对象的类型信息，这点对于反射技术很重要

### 类加载
![](Pasted-image-20230109191903.png)
![](Pasted-image-20230109191923.png)

### 反射的使用
#### Class对象获取
- 根据类名：类名.class
- 根据对象：对象.getClass()
- 根据全限定类名：Class.forName(全限定类名)
- 类加载器：xxxClassLoader.loadClass(全限定类名)

{% note primary %}
其中，通过类名.class，类加载器.loadClass获取class对象，不会进行类加载的初始化，此时静态代码块和静态对象不会执行。
{% endnote %}

#### Constructor类及其用法
可以通过class对象获取该类的构造器。
- getConstructors() 获取所有public构造器
- getDeclaredConstructors() 获取所有声明的构造器
以上两个方法不构成覆盖关系，getDeclaredConstructors能获取私有构造器，却无法获取继承到的public构造器。

{% note primary %}
Field/Method的获取中的declared也类似。
{% endnote %}

#### Method类及其用法
`method.invoke(Object obj, Object... args)`
可以使用arg作为参数，执行obj的method方法

## 深入反射
![](Pasted-image-20230109192732.png)

{% note primary %}
获取类对象时，只会对类进行加载、链接。
只有通过**forName获取类对象**或**创建该类的对象**或**使用该类的静态变量**时才会进行初始化，详情见JVM。
{% endnote %}
>这里做一下区分，有具体实现的是java程序，没有具体实现的我们认为是交给JVM的(native)。
- 类加载
	- forName会加载类，其会调用本地方法加载类（交给JVM）
	- JVM回调类加载其对类进行加载
- 实例生成
	- 查找构造器，若没有则从JVM获取，有则直接从缓存中取出。缓存的结构名为ReflectionData，Class对象对该缓存使用了软引用，通过reflection()方法获取缓存。

## 总结
- 反射也是考虑了线程安全的，放心使用；
- 反射使用软引用relectionData缓存class信息，避免每次重新从jvm获取带来的开销；
- 当找到需要的方法，都会copy一份出来，而不是使用原来的实例，从而保证数据隔离；
- 调度反射方法，最终是由jvm执行invoke0()执行；

# SPI
SPI（Service Provider Interface）服务发现机制，主要用于框架开发。核心思想就是解偶。
![](Pasted-image-20230109194225.png)
当服务的提供者提供了一种接口的实现之后，需要在classpath下的`META-INF/services/`目录里创建一个以服务接口命名的文件，这个文件里的内容就是这个接口的具体的实现类。
当其他的程序需要这个服务的时候，就可以通过查找这个jar包（一般都是以jar包做依赖）的`META-INF/services/`中的配置文件，配置文件中有接口的具体实现类名，可以根据这个类名进行加载实例化，就可以使用该服务了。JDK中查找服务的实现的工具类是：`java.util.ServiceLoader`。

例子：
java定义了java.sql.Driver接口。
mysql提供了mysql-connector-java-6.0.6.jar，其META-INF/services下有文件`java.sql.Driver`，其内容为`com.mysql.cj.jdbc.Driver`，表示使用`com.mysql.cj.jdbc.Driver`实现`java.sql.Driver`。

### SPI和API区别
- SPI - “接口”位于“调用方”所在的“包”中，由外部实现该接口。
- API - “接口”位于“实现方”所在的“包”中，服务自身实现该接口。

### SPI缺点
- 不能按需加载，需要遍历所有的实现，并实例化，然后在循环中才能找到我们需要的实现。
- 获取某个实现类的方式不够灵活，只能通过 Iterator 形式获取，不能根据某个参数来获取对应的实现类。
- 多个并发多线程使用 ServiceLoader 类的实例是不安全的。