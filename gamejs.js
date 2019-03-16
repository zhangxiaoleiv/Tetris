﻿
/*
Author : Zhang xiaolei (张晓雷)
Released under the MIT License.
Email : zhangxiaolei@outlook.com
*/

let log = console.log;

let canvas = document.querySelector("#canvas");
let pix = canvas.getContext("2d");
let scanvas = document.querySelector("#scanvas");
let pix2 = scanvas.getContext("2d");
let scoreDisplay = document.querySelector("#digtalNumber").children;
let fineshLineDisplay = document.querySelector("#line").children;
let levalDisplay = document.querySelector("#leval").children;
let startAndPause = document.querySelector("#startPause");
let reset = document.querySelector("#reset");
let timer = new CreateTimer();

function toNegative (n) {
    return n <= 0 ? n : -n;
}

function create4Arr () {
    return [[0,0], [0,0], [0,0], [0,0]];
}

function toLower(t) {
    if (t.length === 1) {
        if (/^[A-Z]$/.test(t)) {
            return t.toLowerCase();
        } else {
            return t;
        }
    } else {
        return t;
    }
}



function createColor(c) {
    switch (c) {
        // 颜色代码无效，因为table内部的0是不绘制的
        case 0: return "F000";
        //方块类型看下边的对象
        case 1: return "#00CED1"; //四方
        case 2: return "#F60"; //gold
        case 3: return "#0C0";
        case 4: return "#699";
        case 5: return "#06C";
        case 6: return "#909";
        case 7: return "#F00";
        // 延时过度
        case 9: return "#FFD700";
        default:
            console.error("createColor Error");
    }
}

// 每队数组最后一位是旋转的中心点，不能改变次序
// 第一队数组是四方块，没有中心
let tetris = {
    1: [[1, 4], [1, 5], [2, 5], [2, 4]],  // 四方
    2: [[2, 3], [2, 5], [2, 6], [2, 4]],  // 长条
    3: [[1, 3], [1, 5], [2, 4], [1, 4]],  // 三 
    4: [[1, 3], [1, 4], [2, 5], [2, 4]],  // 顺二
    5: [[1, 4], [1, 5], [2, 3], [2, 4]],  // 负二
    6: [[1, 3], [1, 5], [2, 3], [1, 4]],  // 负七
    7: [[1, 3], [1, 5], [2, 5], [1, 4]]   // 顺七
}


function copyAtoB(a, b) {
    if (a.length === b.length) {
        let i = a.length;
        while (i--) {
            b[i][0] = a[i][0];
            b[i][1] = a[i][1];
        }
    } else {
        console.warn("copyAtoB Error : [" + a + "], [" + b + "]");
    }
}

function digtalNumber (n, el) {

    n = n.toString().split("");

    let len = n.length;

    let arr = [];

    for (let i = 0; i < 6 - len; i++) {
        arr[i] = "s";
    }

    arr = arr.concat(n);

    arr.forEach(function (n,i) {
        el[i].setAttribute("class", "n" + n);
    })
}


function smallDisplay(t, c) {
    let tmp = create4Arr();
    copyAtoB(t, tmp);
    tmp = tmp.map(function (n) {
        return [n[0], Math.abs(n[1]) - 3];
    })
    pix2.clearRect(0, 0, 80, 40);
    tmp.forEach(function (n) {
        pix2.beginPath();
        pix2.lineWidth = 1;
        pix2.fillStyle = createColor(c);
        pix2.rect(c === 1 || c === 2 ? n[1] * 20 + 1 : n[1] * 20 + 11, n[0] * 20 - 20 + 1, 19, 19);
        pix2.fill();
    })
}


//存储所有信息数据的table
const table = [];

//绘制游戏方块区域函数
function drawTable() {

    pix.clearRect(0, 0, 200, 400);
    let size = 20;
    let tmp;

    for (let j = 2; j <= 22; j++) {
        
        for (let i = 0; i <= 9; i++) {

            tmp = Math.abs(table[j][i]);
            pix.beginPath();
            pix.lineWidth = 1;
            
            if (sMov.some(function (s) {
                return s[0] === j && s[1] === i;
            })) {
                //绘制阴影
                //如果tmp等于0，说明当前方块为空，可以显示阴影。相反，则说明方块区域有正在移动的方块，给予优先显示。
                if (tmp === 0) {
                    pix.strokeStyle = "#FFF";
                    pix.rect(i * size + 1, j * size - 60 + 1, 18, 18);
                    pix.stroke();
                } else {
                    pix.fillStyle = createColor(tmp);
                    pix.rect(i * size + 1, j * size - 60 + 1, 19, 19);
                    pix.fill();
                }
               
                //只绘制不为0的方块，这样可以空出背景。
            } else if (tmp !== 0) {
                //绘制常规图形
                pix.fillStyle = createColor(tmp);
                pix.rect(i * size + 1, j * size - 60 + 1, 19, 19);
                pix.fill();
            }
        }
    }
    sMov = create4Arr();
}


let moving = [];
let old = [];
let line = [];
let colorId = [];

function createNewCube () {

    colorId.push(rand());

    line.push(tetris[colorId[colorId.length - 1]]);
    
    if (line.length < 2) {
        colorId.push(rand());
        line.push(tetris[colorId[1]])
    }

    smallDisplay(line[1], colorId[1]);

    for (let i of line.shift()) {
        table[i[0]][i[1]] = colorId[0];
        moving.push([i[0],i[1]]);
        old.push([i[0],i[1]]);
    }

    colorId.shift();

    moveDone = false;
}


let sMov = create4Arr();

function shadow () {

    if (!moving.length) return;
 
    copyAtoB(moving, sMov);

    for (let x = 2; x <= 22; x++) {
      
        for (let i of sMov) {
            
            if (i[0] === 22 || table[i[0] + 1][i[1]] < 0) {

                return;

            } 
        }

        moveOneStep(sMov, "down");
    }
}

// 确保在200毫秒的延时过程中，后续的代码不会有效执行
let animateLook = false;

//确保游戏第一个方块创建
let gameJustBegun = true;

function downLoop() {

    if (!gameStart) { return };
    //开局第一次制造方块
    if (gameJustBegun) {
        normalCreate();
        gameJustBegun = false;
        return;
    }

    if (!moving.length) { return }

    let t = 0;

    moveOneStep(moving, "down");

    moving.forEach(function (i) {
        if (i[0] <= 22 && table[i[0]][i[1]] >= 0) {
            t += 1;
        }
    })

    if (t === 4) {

        refreshData();

        copyAtoB(moving, old);

    } else {

        copyAtoB(old, moving);

        !animateLook && checkAndCreate("down");

        return;
    }

}


function moveToLeftOrRight(to) {

    if (!gameStart) { return };

    if (!moving.length) { return };

    if (to === "left") {

        moveOneStep(moving, "left");

    } else if (to === "right") {

        moveOneStep(moving, "right");
    }

    for (let i of moving) {
        if (i[1] < 0 || i[1] > 9 || table[i[0]][i[1]] < 0) {
            copyAtoB(old, moving);
            return;
        }
    }

    refreshData();

    copyAtoB(moving, old);
}


function checkEnd () {
    if(table[2].some(function (i) {
        return (i < 0);
    })) {
        stopLoop();
        gameOver = true;
        gameStart = false;
        startAndPause.innerText = "开始";
        inTop10Check();
        return;
    }
}

let distanceTop10 = document.querySelector("#u-distancetop10");

function inTop10Check () {
    if (localData.data.length < 10 || gameScore > localData.data[9][1]) {
        $("#u-score").text(gameScore);
        $("#u-level").text(gameLevel);
        $("#u-lines").text(finishLine);
        ui.enterTop10.style.display = "block";
        screenCover("open");
    } else {
        ui.gameover.style.display = "block";
        distanceTop10.innerText = localData.data[9][1] - gameScore;
        screenCover("open");
    }
}

let deepLock = false;

function movoToDeep() {

    if (!gameStart) { return };
    if (!moving.length) { return };
    if (deepLock) { return };

    let tmp = getType(old);

    for (let x = 0; x <= 22; x++) {
        for (let i of moving) {
            if (i[0] === 22 || table[i[0] + 1][i[1]] < 0) {
               
                old.forEach(function (i) {
                    table[i[0]][i[1]] = 0;
                })
             
                moving.forEach(function (i) {
                 table[i[0]][i[1]] = toNegative(tmp);
                })

                !animateLook && checkAndCreate("deep");
                deepLock = true;
                return;
            }
        }
        moveOneStep(moving, "down");
    }
}

let gameScore = 0;

function normalAnimateCreate (arr) {

    let h = arr.length;

    animateLook = true;

    stopLoop();

    arr.forEach(function (i) {
        table.splice(i, 1, [9, 9, 9, 9, 9, 9, 9, 9, 9, 9]);
    })

    drawTable();

    moving = [];

    old = [];

    setTimeout(function () {

        finishLine += h;

        switch (h) {

            case 1: {
                gameScore += 100 * gameLevel;
            } break;

            case 2: {
                gameScore += 400 * gameLevel;
            } break;

            case 3: {
                gameScore += 900 * gameLevel;
            } break;

            case 4: {
                gameScore += 1600 * gameLevel;
            } break;

            default: {
                console.warn("score error");
            }
        }

       
        arr.forEach(function (i) {
            table.splice(i, 1);
        })

        while (h--) {
            table.unshift([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
        }

        checkEnd();

        createNewCube();

        shadow();

        drawTable();

        restartLoop();

        digtalNumber(gameScore, scoreDisplay);

        digtalNumber(finishLine, fineshLineDisplay);

        changeLevalAndDisplay(finishLine);

        animateLook = false;

    }, 200)

}

function normalCreate() {
    
    checkEnd();

    moving = [];
    old = [];

    stopLoop();
    createNewCube();
    shadow();
    drawTable();
    restartLoop();
}

function checkCanTouch (arr) {

    let t = 0;

    arr.forEach(function (i) {
        if (i[0] <= 22 && table[i[0]][i[1]] >= 0) {
            t += 1;
        }
    })

    return t < 4;
}

function checkCanMove (arr) {

    if (!arr.length) { return };

    let tmp = create4Arr();

    copyAtoB(arr, tmp);

    moveOneStep(tmp, "down");
    
    let t = 0;

    tmp.forEach(function (i) {
        if (i[0] <= 22 && table[i[0]][i[1]] >= 0) {
            t += 1;
        }
    })

    return t === 4;

}

//以数组的形式返回moving或old二维数组内每一个数组第一位的最小数值和最大数值
//这样在计算得分的时候可以知道程序需要遍历的准确范围

function getMinAndMax(a) {

    if (a.length !== 4) { return [0, 0]};

    let min1, max1, min2, max2;

    if (a[0][0] < a[1][0]) {
        min1 = a[0][0];
        max1 = a[1][0];
    } else {
        min1 = a[1][0];
        max1 = a[0][0];
    }

    if (a[2][0] < a[3][0]) {
        min2 = a[2][0];
        max2 = a[3][0];
    } else {
        min2 = a[3][0];
        max2 = a[2][0];
    }

    return ([
        min1 < min2 ? min1 : min2,
        max1 > max2 ? max1 : max2
    ])

}


function checkGetScore(arr) {

    let checkSave = [];

    let [min, max] = getMinAndMax(arr);

    //因为后边的程序频繁的连续删除得分行，所以必须从下往上记录数值。如果从上往下记录，数据由小到达，连续删除时，先删除序列小的数组，后边的序列数值必然改变，导致错误！

    for (; max >= min; max--) {

        if (table[max].every(function (n) {
            
            return n !== 0;

        })) {

            checkSave.push(max);
        }
    }

    return checkSave;
}
//方块锁定
function tetrisLock (arr) {
    //每一个方块的四个坐标的数值是一样的，所以只需要取出一个
    let t = getType(arr);
    arr.forEach(function (i) {
        table[i[0]][i[1]] = toNegative(t);
    })
}

/*
checkAndCreate是方块操作流程的核心函数
downLoop 和 moveToDeep 在结尾都调用这个函数来做具体的操作
moveToDeep之前已经实现，后边增加了软降功能，moveToDeep不再做调整。
*/

function checkAndCreate(deepOrDown) {

    //checkGetScore用来检测有没有得分，它并没有锁定，纯粹的检测，然后把得分的行数返回
    let arr = checkGetScore(moving);

    let h = arr.length;
    //硬降在调用这个函数前已经锁定了，不做改变。
    if (deepOrDown === "deep") {

        h ? normalAnimateCreate(arr) : normalCreate();

        animateLook = false;
    //软降
    } else if (deepOrDown === "down") {
        //直接得分？
        if (h) {
        
            tetrisLock(old);

            normalAnimateCreate(arr);

            animateLook = false;
        //并没有
        } else {

            animateLook = true;

            let tmp;

            //----调整位置------
 
            setTimeout(function () {

                //调整完先检测能不能再移动，如果能，退出，继续循环
               
                if (checkCanMove(moving)) {
                  
                    animateLook = false;

                    return;
                   
                } else {

                    //如果不能，先检测有没有得分，然后做相应处理
                    //移动后新的坐标
                    tmp = checkGetScore(old);
                    //得分
                    if (tmp.length) {

                        tetrisLock(old);

                        normalAnimateCreate(tmp);

                        animateLook = false;

                    } else {
                        //没得分
                        tetrisLock(old);

                        normalCreate();

                        animateLook = false;

                    }
                }

            },300);
        }
    }
}


function refreshData() {
    shadow();
    let tmp;
    tmp = table[old[0][0]][old[0][1]];
    old.forEach(function (i) {
        table[i[0]][i[1]] = 0;
    })
    moving.forEach(function (i) {
        table[i[0]][i[1]] = tmp;
    })
    drawTable();
}

function moveOneStep(m, to) {
    if (m.length === 4) {
        let len = 4;
        if (to === "left") {
            while (len--) {
                m[len][1] -= 1;
            }
        } else if (to === "right") {
            while (len--) {
                m[len][1] += 1;
            }
        } else if (to === "down") {
            while (len--) {
                m[len][0] += 1;
            }
        } else if (to === "up") {
            while (len--) {
                m[len][0] -= 1;
            }
        }
    } else {
        console.error("function error : moveOneStep")
    }
}

function rotate(d) {

    if (!gameStart) { return }

    if (!moving.length) { return }

    let tetrisType = getType(moving);

     //四方直接退出
    if (tetrisType === 1) {
        return;
    }
    
    //180度旋转只针对 T、+L、-L 有用，其它的方块无效
    if (d === 2 && [3, 6, 7].indexOf(tetrisType) < 0 ) {
        return;
    }

    //每次都保存一下方块的最低点
    let lowPoint = getMinAndMax(moving)[1];

    if (tetrisType === 2) {
        //长条，判断是否靠墙，如果靠墙，变形时偏移出空间来
        //坐标[3][1]为坐标数组的最后一位，也就是方块的中心
        if (moving[3][1] === 0) {

            moveOneStep(moving, "right");

        } else if (moving[3][1] == 8) {

            moveOneStep(moving, "left");

        } else if (moving[3][1] == 9) {
            //移动两格才能空出位置
            moveOneStep(moving, "left");
            moveOneStep(moving, "left");
        }

    } else {
        //其它方块
        if (moving[3][1] === 0) {

            moveOneStep(moving, "right");

        } else if (moving[3][1] === 9) {

            moveOneStep(moving, "left");

        }
    }
    
    /*
    创建 tmp 保存 moving 的数值
    从 tmp 中取出中心 c;
    xtmp用来保存变形后的数据。
    */

    let tmp = create4Arr();
    copyAtoB(moving, tmp);
    let c = tmp.pop();
    let xtmp = [];

    /*
    d == 0 顺时针旋转
    d == 1 逆时针旋转
    d == 2 180度旋转
    长条旋转为了简化代码，只采用了两个方向
    原因是长条没有一个稳定的中心，如果任意确定两个方块中的一个，旋转起来不“稳定”。
    如果在旋转的过程中切换中心，我没有去细想，感觉可能写起来比较麻烦。
    最主要的是感觉没有必要，现在确定左侧方块为中心，只做180度来回旋转，看起来比较稳定，方块的位置也好预测。
    长条的本质是 三个短长条 加 一个方块， 三个方块按指令旋转，另外一个方块，做正下到右中的来回摆动，组合在一起就是一个180度转动的长条
    */

    if (d === 0) {

        //顺时针旋转

        for (let i of tmp) {
            //判断正下方
            if (i[0] - c[0] === 2 && i[1] === c[1]) {
                //长条在正下，采用逆时针摆动，方向相反
                xtmp.push([i[0] - 2, i[1] + 2]);
            } else if (i[0] > c[0] && i[1] === c[1]) {
                //顺时旋转，所以 i[i] - 1
                xtmp.push([i[0] - 1, i[1] - 1]);
            }
            //方向右中
            //因为方向是在右中，都是顺时旋转，所以方向想同
            if (i[0] === c[0] && i[1] - c[1] === 2) {
                xtmp.push([i[0] + 2, i[1] - 2])
            } else if (i[0] === c[0] && i[1] > c[1]) {
                xtmp.push([i[0] + 1, i[1] - 1]);
            }

            i[0] < c[0] && i[1] < c[1] && xtmp.push([i[0], i[1] + 2]); // 1 -3
            i[0] < c[0] && i[1] === c[1] && xtmp.push([i[0] + 1, i[1] + 1]); //2-4
            i[0] < c[0] && i[1] > c[1] && xtmp.push([i[0] + 2, i[1]]); //3-5
            i[0] > c[0] && i[1] > c[1] && xtmp.push([i[0], i[1] - 2]); //5-7
            i[0] > c[0] && i[1] < c[1] && xtmp.push([i[0] - 2, i[1]]); //7-1
            i[0] === c[0] && i[1] < c[1] && xtmp.push([i[0] - 1, i[1] + 1]); //8-2
        }


    } else {

        //逆时针旋转和180旋转
        //180 度旋转等于两个90度的逆时针旋转

        do {

            for (let i of tmp) {

                if (i[0] - c[0] === 2 && i[1] === c[1]) {
                    xtmp.push([i[0] - 2, i[1] + 2]);
                } else if (i[0] > c[0] && i[1] === c[1]) {
                    xtmp.push([i[0] - 1, i[1] + 1]);
                }

                if (i[0] === c[0] && i[1] - c[1] === 2) {
                    xtmp.push([i[0] + 2, i[1] - 2])
                } else if (i[0] === c[0] && i[1] > c[1]) {
                    xtmp.push([i[0] - 1, i[1] - 1]);
                }

                i[0] < c[0] && i[1] < c[1] && xtmp.push([i[0] + 2, i[1]]); // 
                i[0] < c[0] && i[1] === c[1] && xtmp.push([i[0] + 1, i[1] - 1]);
                i[0] < c[0] && i[1] > c[1] && xtmp.push([i[0], i[1] - 2]);
                i[0] > c[0] && i[1] > c[1] && xtmp.push([i[0] - 2, i[1]]);
                i[0] > c[0] && i[1] < c[1] && xtmp.push([i[0], i[1] + 2]);
                i[0] === c[0] && i[1] < c[1] && xtmp.push([i[0] + 1, i[1] + 1]);
            }
            //如果 d 等于 2，旋转两次，中间必须对数值做交换处理
            if (d === 2) {
                tmp = xtmp;
                xtmp = [];
            }

        } while (--d);

    }

    //中心位置不变，旋转完成将中心加入末尾，方块末尾为中心
    xtmp.push(c);

    //获取移动后的最低位置坐标
    let lowPoint2 = getMinAndMax(xtmp)[1];

    /*
    如果animateLook为ture，说明方块已经处于落地状态，这个时候可以通过变形后的最底点和变形前的最低点想对比
    以判断方块在变形后是否已经超出原来的最低点。如果超出，则计算偏移量，进行向上偏移，确保变形后能贴地。
    */

    if (animateLook) {
        if (lowPoint2 > lowPoint) {
            for (let i = 0; i < lowPoint2 - lowPoint; i++) {
                moveOneStep(xtmp, "up");
            }
        }
    }

    /*
    这一段的目的是针对长条在横向下落时，因为中心点不均匀，导致距离还有一行空间却无法旋转的问题。
    但这段代码也导致如果快速旋转长条，长条可以一直不降落，就酱紫！
    */

    if (!animateLook && checkCanTouch(xtmp)) {
        moveOneStep(xtmp, "up");
    }

    for (let i of xtmp) {
        if (i[1] < 0 || i[1] > 9 || table[i[0]][i[1]] < 0) {
            return;
        }
    }

    copyAtoB(xtmp, moving);
    refreshData();
    copyAtoB(moving, old);

};

let gameStart = false;
let gameOver = true;
/*
屏蔽系统连续触发锁。因为所有的移动都是由函数定时循环驱动的，所以要屏蔽系统的连续触发，以避免作用交错在一起。
每次按下按键，只会执行一次移动函数（函数内定时，连续触发），松开按键，锁开启，移动函数停止运行。
*/
let leftLock = false;
let rightLock = false;
let downLock = false;

// 第二级采用 setTimeInterval 进行连续触发
let leftStop;
let rightStop;
let donwStop;

// 第一级采用 setTimeout 延时
let left1stStop;
let right1stStop;
let down1stStop;

document.onkeydown = function (k) {

    let key = toLower(k.key);

    if ( key === keyboard.left ) {

        if (!leftLock) {
            clearTimeout(right1stStop);
            clearInterval(rightStop);
            moveToLeftOrRight("left");
            moveLeftPlus("left");
            leftLock = true;
        }

    } else if ( key === keyboard.right) {

        if (!rightLock) {
            clearTimeout(left1stStop);
            clearInterval(leftStop);
            moveToLeftOrRight("right");
            moveRightPlus("right");
            rightLock = true;
        }

    } else if ( key === keyboard.down ) {

        if (!downLock) {
            stopLoop();  //防止downloop循环和向下按钮的动作相互重合
            downLoop();
            moveDownPlus();
            downLock = true;
        }

    } else if ( key === keyboard.deep ) {

        movoToDeep();
        deepLock = true;

    } else if ( key === keyboard.rotate ) {
        //顺时针旋转
        rotate(0);

    } else if ( key === keyboard.rotate1) {

        //逆时针旋转
        rotate(1);
    } else if ( key === keyboard.rotate2) {

        //180度旋转
        rotate(2);
    }
}

// 解除连续触发

document.onkeyup = function (k) {

    let key = toLower(k.key);
    
    if (key === keyboard.deep) {
        deepLock = false;
    } else if (key === keyboard.left) {
        clearTimeout(left1stStop);
        clearInterval(leftStop);
        leftLock = false;
    } else if (key === keyboard.right) {
        clearTimeout(right1stStop);
        clearInterval(rightStop);
        rightLock = false;
    } else if (key === keyboard.down) {
        clearTimeout(down1stStop);
        clearInterval(donwStop);
        restartLoop();
        downLock = false;
    }
}


function moveLeftPlus(val) {
    left1stStop = setTimeout(function () {
        leftStop = setInterval(function () {
            moveToLeftOrRight(val)
        }, keyboard.repeDelay)
    }, keyboard.firstDelay)
}

function moveRightPlus(val) {
    right1stStop = setTimeout(function () {
        rightStop = setInterval(function () {
            moveToLeftOrRight(val)
        }, keyboard.repeDelay)
    }, keyboard.firstDelay)
}

function moveDownPlus () {
    down1stStop = setTimeout(function () {
        donwStop = setInterval(function () {
            downLoop();
        }, keyboard.repeDelay)
    }, keyboard.firstDelay);
}


function resetGame () {
    for (let row = 0; row <= 22; row ++) {
        table[row] = [];
        for (let col = 0; col <= 9; col ++) {
            table[row].push(0);
        }
    }
    moving = [];
    old = [];
    line = [];
    colorId = [];
    finishLine = 0;
    digtalNumber(0, scoreDisplay);
    digtalNumber(0, fineshLineDisplay);
    digtalNumber(0, levalDisplay);
    smallDisplay(create4Arr(), 0);
    stopLoop();
    timeSpeed = 1000;
    gameScore = 0;
    lockStop = false;
    gameStart = false;
    gameOver = true;
    gameJustBegun = true;
    drawTable();
}

startAndPause.addEventListener("click", function () {
    //游戏开始
    if (!gameStart) {
        gameOver && resetGame();
        gameStart = true;
        gameOver = false;
        this.innerText = "暂停";
        this.setAttribute("style", "background-color : white");
        changeLevalAndDisplay(finishLine);
        restartLoop();
    } else {
        //游戏暂停
        clearInterval(stopGame);
        gameStart = false;
        this.innerText = "继续";
        this.setAttribute("style", "background-color : gold");
    }
}, false);

reset.addEventListener("click", function () {

    if (!gameOver) {

        areYouSure();
        //次函数的目的仅仅是弹出窗口，后续的操作有按键触发驱动
       
    } else {
        resetGame();
        startAndPause.innerText = "开始";
    }

}, false);


let finishLine = 0;

let timeSpeed;

let stopGame;

let lockStop = false;

function mainLoop () {
    stopGame = setInterval (function () {
        !lockStop && downLoop();
    }, timeSpeed);
}
//lockStop的目的是为了直接终止mainLoop循环内的所有内容
function stopLoop () {
    clearInterval(stopGame);
    lockStop = true;
}

function changeLoopSpeed (t) {
    clearInterval(stopGame);
    timeSpeed = t;
    mainLoop();
}

function restartLoop () {
    lockStop = false;
    clearInterval(stopGame);
    mainLoop();
}

let gameLevel = 0;

let timeList = "1000,850,722,613,521,442,375,318,270,229,194,164,139,118,100,85,72,61,51,43,36,30,25,21,17".split(",");

function changeLevalAndDisplay (line) {
    line = (line === 0 ? 0 : line -= 1);
    let level = (line < 10 ? 0 : parseInt(line / 10)) + 1;
    let time = +timeList[level - 1];
    if (time === NaN) {
        gameLevel = 666666;
        time = 1000;
    }
    gameLevel = level;
    changeLoopSpeed(time);
    digtalNumber(gameLevel, levalDisplay);
}



//初始游戏网格界面
resetGame();

function getType (m4) {
    if (m4.length === 4) {
        return table[m4[0][0]][m4[0][1]];
    } else {
        console.error("function error : getType");
    }
}

//-----------------------------按钮背景掩盖函数-------------------------------------//

function screenCover (c) {
    let w = window.innerWidth + "px";
    let h = window.innerHeight + "px";
    if (c === "open") {
        $("#backGroundCover").css({
            display : "block",
            width : w,
            height : h
        })
    } else if (c === "close") {
        $("#backGroundCover").css({
            display : "none",
            width : "0px",
            height : "0px"
        })
    }
}


//----------------------------------窗口DOM对应的变量存储-------------------------------------

let ui = Object.create(null);
ui.reset = document.querySelector("#u-reset");
ui.gameover = document.querySelector("#u-gameOver");
ui.enterTop10 = document.querySelector("#u-enterTop10");
ui.info = document.querySelector("#u-info");


//------------------------------点击t-close标签，关闭窗口-------------------------------------

document.querySelectorAll((".t-win")).forEach(function (item) {
    item.querySelectorAll(".t-close").forEach(function (i) {
        i.addEventListener("click", function () {
            item.style.display = "none";
            screenCover("close");
        }, false);
    })
})

//-------------------------------------是否重置功能区域-----------------------------------------

//打开窗口
function areYouSure () {
    ui.reset.style.display = "block";
    screenCover("open");
}

//"确认" 按钮事件
document.querySelector("#u-resetBT").addEventListener("click", function () {
    resetGame();
    startAndPause.innerText = "开始";
    startAndPause.style.backGroundColor = "white";
    ui.reset.style.display = "none";
    screenCover("close");
})


//-----------------------------------------信息板区域----------------------------------------------


//初始数据
let initGameDate = {
    data : [],
    keyboard : {
        deep : "w",
        left : "a",
        right : "d",
        down : "s",
        rotate : "k", //顺时针
        rotate1 : "j", //逆时针
        rotate2 : "l", //180度
        firstDelay : 100,
        repeDelay : 65
    }
} 
//载入数据


let localData = JSON.parse(localStorage.getItem("TetrisGameData"));

if (!localData) {
    localData = initGameDate;
}

let keyboard = localData.keyboard;

//将比赛记录保存到浏览器
function saveData() {
    if (window.localStorage) {
        localStorage.setItem("TetrisGameData", JSON.stringify(localData))
    } else {
        console.error("存储数据失败 程序未找到 window.localStorage")
    }
}

function checkDataAndSave (data) {

    let len = localData.data.length;

    let local = localData.data;

    if (len < 10) {

        local.push(data); 
        local.sort(function (a, b) {
            return b[1] - a[1];
        })

    } else {

        for (let i = 0; i < len; i ++) {
            if (data[1] > local[i][1]) {
                local.splice(i , 0, data);
                local.pop();
                break;
            }
        }
    }

    saveData();
}

ui.trList = document.querySelectorAll("#table-list tr");
//清除比赛记录板Element里的数据
function clearInfo () {
    let len = ui.trList.length;
    for (let j = 1; j < len; j++) {
        for (let i = 0; i < ui.trList[j].children.length; i ++) {
            ui.trList[j].children[i].innerText = "";
        }
    }
}
//将localData的数据展示到记录板
function displayinfoFunc(data) {
    let len = data.length + 1;
    for (let j = 1; j < len; j ++) {
        for (let i = 0; i < ui.trList[j].children.length; i ++) {
            if (i === 0) {
                ui.trList[j].children[i].innerText = j;
            } else {
                ui.trList[j].children[i].innerText = data[j - 1][i - 1];
            }
        }
    }
}


$("#infotest").click(function () {
    displayinfoFunc(localData.data);
    ui.info.style.display = "block";
    screenCover("open");
})

ui.deep = document.querySelector("#opt-deep");
ui.left = document.querySelector("#opt-left");
ui.down = document.querySelector("#opt-down");
ui.right = document.querySelector("#opt-right");
ui.rotate = document.querySelector("#opt-rotate");
ui.rotate1 = document.querySelector("#opt-rotate1");
ui.rotate2 = document.querySelector("#opt-rotate2");
ui.firstDelay = document.querySelector("#opt-firstdelay");
ui.repeDelay = document.querySelector("#opt-repedelay");


document.querySelector("#optiontest").addEventListener("click", function () {
    document.querySelector("#option").style.display = "block";
    ui.deep.value = keyboard.deep;
    ui.left.value = keyboard.left;
    ui.down.value = keyboard.down;
    ui.right.value = keyboard.right;
    ui.rotate.value = keyboard.rotate;
    ui.rotate1.value = keyboard.rotate1;
    ui.rotate2.value = keyboard.rotate2;
    ui.firstDelay.value = keyboard.firstDelay;
    ui.repeDelay.value = keyboard.repeDelay;
    screenCover("open");
})

document.querySelector("#clearData").addEventListener("click", function () {
    if (confirm("清除所有数据 ?")) {
        localData.data = [];
        localStorage.clear();
        clearInfo();
    }
},false)


//------------------------top10 录入区域------------------------


document.querySelector("#u-enterNameBT").addEventListener("click", function () {
    let name = document.querySelector("#u-enterName").value;
    checkDataAndSave([name || "无名英雄", gameScore, gameLevel, finishLine]);
    screenCover("close");
    ui.enterTop10.style.display = "none";
},false);


//-----------------------关于-------------------------------

ui.about = document.querySelector("#about-win");
document.querySelector("#aboutme").addEventListener("click", function () {
    ui.about.style.display = "block";
    screenCover("open");
}, false)


let inputTmp = "";

//按键录入，主要目的是能够支持方向键录入
document.querySelectorAll(".opt-i").forEach(function (item) {
    item.addEventListener("click", function () {
        inputTmp = this.value;
        this.value = "";
        this.onkeydown = function (k) {
            if (k.key.length === 1) {
                this.value = "";
            } else {
                this.value = k.key;
            }
        }
    })
})

document.querySelectorAll(".opt-i").forEach(function (item) {
    item.onblur = function () {
        if (this.value === "") {
            this.value = inputTmp;
        }
    }
})


document.querySelector("#opt-bt-yes").addEventListener("click", function () {
    keyboard.deep = toLower(ui.deep.value);
    keyboard.left = toLower(ui.left.value);
    keyboard.down = toLower(ui.down.value);
    keyboard.right = toLower(ui.right.value);
    keyboard.rotate = toLower(ui.rotate.value);
    keyboard.rotate1 = toLower(ui.rotate1.value);
    keyboard.rotate2 = toLower(ui.rotate2.value);
    keyboard.firstDelay = parseInt(ui.firstDelay.value);
    keyboard.repeDelay = parseInt(ui.repeDelay.value);
    document.querySelector("#option").style.display = "none";
    saveData();
    screenCover("close");
})


