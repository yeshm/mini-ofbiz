mini-ofbiz
==========

A Mini Framework base on Ofbiz.

[Ofibz](http://ofbiz.apache.org/)是一整套完善的企业级，以java为核心，结合很多开源项目，支持使用脚本来编写业务逻辑的开源项目。

跟一般的技术框架不同，Ofbiz更大的价值体现在业务上，它也是一整套完整的企业ERP,电子商务业务框架，包括数据库，业务代码等方方面面。如果项目跟ERP，电子商务沾边，建议直接基于Ofbiz，或者大量的参考Ofbiz进行二次开发。

但是做为小型新项目的起点，Ofbiz貌似一个庞然大物，无从下手，因此[mini-ofbiz](https://github.com/yeshm/mini-ofbiz)来了。mini-ofbiz是基于Ofbiz，并剔除了所有业务模块，加入[BUI](http://www.builive.com/)前端框架，适合做为小中大型项目起点的一个开源项目。

mini-ofbiz，延续了java语言的优势，业务逻辑可使用脚本语言(如groovy)实现，以及Entity Engine，Service Engine，Widget Engine的完美配合，使得开发过程中基本不需要重启服务器，所有书写的代码都是业务相关的，简洁的。让开发人员从琐碎的工作中脱离出来，把全部精力集中在业务实现上。

## 运行 ##
下载代码后，在命令行，mini-ofbiz主目录下，运行

1. 载入demo数据: ant load-demo
2. 启动服务: ant start

访问，
示例程序：localhost:8080/example， 管理工具：localhost:8080/webtools，用户名：admin，密码：ofbiz。

demo: http://120.27.247.3:32782/example(http://120.27.247.3:32782/example)

## 交流 ##

QQ群：242837007

目前文档较缺，有问题可在群里提出，参考ofbiz官方提供的文档，后续会慢慢完善，欢迎有兴趣的同学一起参与。

## 主要目录和文件简单介绍 ##
Ofbiz采用了插件式的组件架构，每个组件都可以是一个应用程序，处于自己的目录中。这样避免了组件之间的互相干扰和结构组织紊乱的问题，可以随时移除或者引入定制化的组件。比如基于mini-ofbiz开发一段时间之后，可以随时引入Ofbiz自带的核心业务组件。有利于大型系统的模块划分，功能复用。

mini-ofbiz主目录：

    2013-07-08  09:03            14,485 .classpath
    2013-07-08  09:03             1,205 .gitignore
    2013-07-08  09:03               651 .hgignore
    2013-07-08  09:09               531 .project
    2013-07-08  09:03    <DIR>          .settings
    2013-07-08  09:03             1,203 .xmlcatalog.xml
    2013-07-08  09:03             1,412 ant
    2013-07-08  09:03             1,153 ant.bat
    2013-07-08  09:03             6,120 APACHE2_HEADER
    2013-09-02  19:25            69,318 build.xml
    2013-07-08  09:03             6,882 common.xml
    2013-07-08  09:03    <DIR>          debian
    2013-07-08  09:04    <DIR>          framework
    2013-07-08  09:04    <DIR>          hot-deploy
    2013-07-08  09:04             2,451 ivy.xml
    2013-07-08  09:04    <DIR>          lib
    2013-07-08  09:03           157,795 LICENSE
    2013-07-08  09:04            10,506 macros.xml
    2013-07-08  09:04             2,348 mergefromtrunk.bat
    2013-07-08  09:04             3,234 mergefromtrunk.sh
    2013-07-08  09:03            18,462 NOTICE
    2013-07-08  09:03             9,049 OPTIONAL_LIBRARIES
    2013-07-08  09:03             3,509 README
    2013-07-08  09:03                59 README.md
    2013-09-02  19:45    <DIR>          runtime
    2013-07-08  09:04    <DIR>          themes
    2013-07-08  09:04    <DIR>          tools


- framework：	框架的自身实现，包括Entity Engine，Service Engine，Widget Engine，管理工具webtools等。。。

- runtime： 运行时目录，日志文件会保存在runtime\logs。

- hot-deploy： 热部署目录，我们开发的程序一般都是放在这个目录底下。如我们的example组件在hot-deploy\example。

example组件目录：

    2013-09-02  19:45<DIR>  build
    2013-07-08  09:04 5,872 build.xml
    2013-07-08  09:04<DIR>  config
    2013-07-08  09:04<DIR>  data
    2013-07-08  09:04<DIR>  entitydef
    2013-07-08  09:04<DIR>  lib
    2013-07-08  09:04 2,150 ofbiz-component.xml
    2013-07-08  09:04<DIR>  script
    2013-09-01  19:59<DIR>  servicedef
    2013-07-08  09:04<DIR>  src
    2013-07-08  09:04<DIR>  testdef
    2013-07-08  09:04<DIR>  webapp

- build： java代码编译和打包的目标目录。
- build.xml： ant文件。
- config： 存放配置文件，如国际化资源文件和properties文件。
- data： 数据目录，存放应用程序的seed，demo数据，xml格式。可通过ant导入，或者webtools导入导出。
- entitydef： entity目录，包括entity(数据模型，对应数据库表)定义，view-entity(类似数据库视图，只能查询)定义，Entity Event Condition Actions (EECAs，可拦截entity事件，执行一些动作)。
- lib： 存放引用的java类库。
- ofbiz-component.xml： 组件描述文件，告诉框架本组件的所有资源配置，如classpath，entity定义、数据、eecas定义，service、secas定义，测试用例，webapp配置等。
- script： 脚本目录，包含业务逻辑实现的脚本文件，主要是groovy。
- servicedef： service目录，包括servcie定义，Service Event Condition Actions (SECAs)定义。
- src： java源文件目录。
- testdef： 测试用例定义目录。
- webapp： web应用程序目录，一个组件可以有多个webapp。一个webapp类似一个j2ee web程序。

## hello world ##
1. 在命令行，mini-ofbiz主目录，输入 ant create-component。
2. 根据提示，依次输入并回车 helloworld，HelloWorld，helloworld，HELLOWORLD，y。如果看到执行了一些创建和copy动作，提示

         [echo] Component successfully created in folder D:\git\mini-ofbiz/hot-deploy/helloworld.
         [echo]               Restart OFBiz and then visit the URL: http://localhost:8080/helloworld
说明hello world组件创建成功了，存放于hot-deploy\helloworld。
3. 载入demo数据，启动服务后，访问localhost:8080/helloworld。由于创建的组件引用了被剔除组件的资源，现在页面会报错，需要手动修改一下。
4. 修改hot-deploy\helloworld\widget\CommonScreens.xml，第20行，为：

         <decorator-section-include name="body"/>
刷新页面，出现登录页面。

5. 登入后，出现空白页面。修改hot-deploy\helloworld\widget\HelloWorldScreens.xml，在第12行之后插入

         <label text="Hello world!"/>
刷新页面，又一个hello world诞生了。

6. example引入了BUI框架，并实现了一些简单的业务逻辑，可作为进一步实现的参考。


