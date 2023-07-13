export const createTree = `
param(
    [parameter(Mandatory)][string]$MethodPath,
    [parameter(Mandatory)][string]$MethodCode
)

$method_elems = ("tmp." + $MethodPath).Split(".")
$dir = [string]::Join("/", $method_elems[0..($method_elems.Length-2)])
$file = $method_elems[-1] + ".simtalk"
New-Item -Path $dir -ItemType Directory -Force
$org_dir = Get-Location
Set-Location $dir
Write-Output $MethodCode > $file
Set-Location $org_dir`;

export const autoExec = {
  main: `
self.&reload_methods.load("./reload_methods.simtalk")
self.reload_methods
`,
  [Symbol.toStringTag]: 'autoExec'} as const;

export const exportMethods = {
  main: `
/*----------------------------------------------
クラスライブラリ中の全メソッドを抽出して、指定のディレクトリ下に書き出す
export_dir: 書き出す先のディレクトリ
----------------------------------------------*/
param export_dir: string := "hoge"
var root_dir := basis.Models
var methods := self.find_methods(root_dir)
for var i := 1 to methods.dim
  self.write_method(methods[i], "src")
next
// TODO: MethodInMethodの場合、全部作ってみて同じ階層に同名のディレクトリがあればそこにmoveする必要がある
debug`,
  findMethods: `
param dir : object -> string[]
var methods : string[]
for var i := 1 to dir.numNodes
  var node := dir.node(i)
switch node.internalClassType
case "Method"
  methods.append(obj_to_str(node))
  methods.appendArray(self.~.find_user_methods(node))
case "Folder", "Frame"
  methods.appendArray(self.execute(node))
else
  methods.appendArray(self.~.find_user_methods(node))
end
next
return methods`,
  findUserMethods: `
param node: object -> string[]
var methods: string[]
// nodeの属性からユーザ定義属性を抽出
var attributes : table
var attributes_notin_userdefined : table
attributes.create
attributes_notin_userdefined.create
node.putAttributeNamesIntoTable(attributes_notin_userdefined, false, true, 1)
node.putAttributeNamesIntoTable(attributes, true, true, 1)
attributes_notin_userdefined.copyRangeTo({1,1}..{*,*}, attributes, 4, 1)
// ユーザ定義有無で取り出した属性一覧を比べて片方にしかないものにマーク
attributes.setDataType(7, boolean)
attributes.setformula({7,1}..{7,*}, "@[1,yself]=@[4,yself]")
attributes.calculateList({7,1}..{7,*})
// マークされてる物を全部確認
while attributes.find({7,1}..{7,*}, false)
  var user_attr := to_str(node) + . + attributes[1, attributes.CursorY]
  // ユーザ定義がメソッドなら追加
  if existsMethod(user_attr)
    methods.append(user_attr)
  end
end
return methods`,
  writeMethod: `
/*---------------------------------------------------
指定されたメソッドの階層構造をディレクトリツリーにしてtextファイルに書き出す

method_path: 書き出す対象のメソッドのパス
root_dir: 書き出す先のルートディレクトリ
---------------------------------------------------*/
param method_path: string, root_dir: string

var method := str_to_method(method_path)
var cmd := "powershell .\\create_tree.ps1"
var code := regex_replace(method.program, "\"", "\\\"")
cmd += " '" + method_path + "' '" + code + "'"
var proc := startExtProc(cmd, true, true)
if proc > 0
	print "Exported " + method_path
else
	throwRuntimeError("Don't export method: " + method_path)
end `,
  [Symbol.toStringTag]: 'exportMethods'} as const;