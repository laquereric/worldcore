#!/bin/bash
cd `dirname "$0"`
APP=$(basename `pwd`)
WONDERLAND=../../../wonderland

if [[ ! -d $WONDERLAND ]] ; then
    echo "Where is Wonderland? Not at '$WONDERLAND' it seeems ¯\_(ツ)_/¯"
    exit 1
fi

# update worldcore
(cd ../../ ; pnpm i) || exit 1

# update this
pnpm i || exit 1

# build this
rm -rf dist
pnpm run build-prod || exit 1

# copy to croquet.io/testing/
TARGET=$WONDERLAND/servers/croquet-io-testing/$APP
rm -rf $TARGET/*
cp -a dist/ $TARGET/

# commit
cd $TARGET
git add . && git commit -m "[$APP] deploy to croquet.io/testing/$APP/" -- . && git --no-pager log -1 --stat
