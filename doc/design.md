# 設計

## PlantSimの構造

```plantuml
@startuml
class "フォルダ" as Fo
class "クラス" as C
class "フレーム" as Fr
class "メソッド" as M

C <|--M
Fo o-- Fo
Fo o-- C
Fo o-- Fr
Fr o-- Fr
Fr o-- C
C o-- M
@enduml
```

- メソッドの所在は3種類ある

```plantuml
@startuml
object "フォルダ" as Fo
object "メソッド" as M
Fo o- M
@enduml
```

- フォルダ直下のメソッドはクラス
  - staticに実行はできる
  - フレームなどにインスタンスとして配置もできる

```plantuml
@startuml
object "フレーム" as Fr
object "メソッド" as M
Fr o- M
@enduml
```

- フレーム直下のメソッドはインスタンス

```plantuml
@startuml
object "クラス" as C
object "メソッド" as M
C o- M
@enduml
```

- クラス直下のメソッドはクラス
  - クラスのインスタンスから実行できる
  - クラスがメソッドになることもできる

## パースを考える

- Pathの概念があってxxx.yyy.zzzと`.`でつなぐ
  - インスタンスであっても同じ
- メソッドだけに注目すればディレクトリツリーでまま構造を再現すれば何とかなりそう
  ```plantuml
  @startsalt
  {
  {T
  + RootFolder
  ++ Folder1
  +++ Folder2
  ++++ Class1
  +++++ Method
  ++ Frame1
  +++ Method
  +++ Class1Instance
  ++++ Method(Override)
  ++++ Method(Append)
  ++ Class2
  +++ Method
  }
  }
  @endsalt
  ```
  OverrideかAppendか区別しないといけないのに注意は必要
  Folder->Class->StaticMethod->Frameの順にパースしないとOverrideがおかしくなる

- ディレクトリツリーのパース
  - ファイルはメソッド(.simtalkに限定してもいいかも)
  - ディレクトリはFolder or Frame or Class
    - Prefixで判断にするか
      |種類|Prefix|
      |:--|:--|
      |Folder|何もつけない(無印)|
      |Frame|Frame or F|
      |Class|Class or C|
      - インスタンスも構造上はClassでいいか
        - Frame下はインスタンスしかありえないから判断は可能

# 設計

- srcのroot以下がモデルと同じ構造化されてるとして...

```plantuml

autoactivate on

participant main
participant folder
participant file

main -> folder: find
return folders, files

```



var src_files : list

src_files := getFilesOfFolder(".\src\*\*.simtalk")

debug



model内にautoexecを置く

関数内にreload的なメソッドを用意して、↑をloadする

Loadされる側で各メソッドと対象ファイルパスの組で列挙されたload命令を書いておいて、それをautoexecで実行

Loadされるファイルは拡張側で自動生成するようにする