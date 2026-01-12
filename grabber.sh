# Here you start the script that will download downloads.txt links.
if test -z "$1"; then
    echo "Missing variable, are you sure you want to use this script? Use start.sh instead"
fi
URL=$1
ID=$2
echo ${URL}
echo ${ID}
mkdir -p ./images
wget -U "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36" "$1" -O "./images/${ID}.jpeg"