cat downloads.txt | parallel -j 50 --workdir $PWD --colsep ' ' "bash ./grabber.sh {1} {2}"
