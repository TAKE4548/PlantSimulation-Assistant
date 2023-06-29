MethodPath=$1
MethodCode=$2

method_elems=("tmp" ${MethodPath//./ })
new_dir=$(IFS='/'; echo "${method_elems[*]::${#method_elems[*]}-1}")
file=${method_elems[-1]}".simtalk"
mkdir -p $new_dir
org_dir=$PWD
cd $new_dir
echo $MethodCode > $file
cd $org_dir