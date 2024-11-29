
/** @type HTMLCanvasElement */
var canvas = document.getElementById("mainCanvas");
var ctx = canvas.getContext('2d');

const cellSize = 80;
var startX = 70;
var startY = 70;

const grayCodes2 = ["0", "1"];
const graycodes4 = ["00", "01", "11", "10"];

var nRows = 2;      // no of rows
var nCols = 4;      // no of columns
var nVars = 3;      // no of variables in kmap
var map = [];       // kmap values
var rowGrayCodes = [];
var colGrayCodes = [];
var rowVars = "";   // variables labeled for the rows 
var colVars = "";   // variables labeled for the columns   Ex: AB, CD,  A, BC, etc..

function changeNVars(n) {
    nVars = n;
    if (n<2 || n>4) {
        console.log(`can't change no. of variables to ${n}`);
        return;
    }
    // for rows
    if (n<=3) {
        nRows = 2;
        rowGrayCodes = grayCodes2;
    } else {
        nRows = 4;
        rowGrayCodes = graycodes4;
    }
    
    // for cols
    if (n>2) {
        nCols = 4;
        colGrayCodes = graycodes4;
    } else {
        nCols = 2;
        colGrayCodes = grayCodes2;
    }

    // setting rowVars and colVars
    if (n===2)      rowVars = "A",  colVars = "B";
    else if (n===3) rowVars = "A",  colVars = "BC";
    else if (n===4) rowVars = "AB", colVars = "CD";

    // calculating startX startY
    let width = canvas.width;
    let height = canvas.height;

    let mapWidth = nCols*cellSize;
    let mpaHeight = nRows*cellSize;

    startX = Math.trunc(width/2 - mapWidth/2)   +10     // +10 to "look" middle alligned - there are more elements on the left side
    startY = Math.trunc(height/2 - mpaHeight/2) +10

    map = Array(2**n).fill('0');
}
changeNVars(4);

selected = [];

function solveKMap() {
    // debugger;
    var groups = [];
    var xMap = []; 
    // extended map, one more copy of left column is placed at right, one more copy of top row is place at bottom
    // bottom right cell is same as top left
    for(let i=0; i<=nRows; i++) {
        // mi, mj are actual indices of i an j in the map
        let mi = i % nRows;
        let mj;

        xMap[i] = [];
        for(let j=0; j<=nCols; j++) {
            mj = j % nCols;
            xMap[i][j] = map[mi*nCols+mj];
        }
    }
    console.log(xMap);

    var map4Hor = []; // map of blocks of 4-cell-horizontal
    // at i-th index, 1 if ith row has atleast one 1 and all are either 1s or Xs
    for(let i=0; i<nRows; i++) {
        let oneExists = false; // atleast one 1 exists
        let valid = true; // all are either 1s or Xs
        for(let j=0; j<nCols; j++) {
            if (xMap[i][j]=='1') oneExists=true;
            else if(xMap[i][j]=='0') {
                valid=false;
                break;
            }
        }
        if (oneExists && valid) map4Hor[i] = 1;
        else map4Hor[i] = 0;
    }
    map4Hor[nRows] = map4Hor[0]; // just one more copy of top row 

    var map4Ver = []; // map of blocks of 4-cell-vertical;
    for(let j=0; j<nCols; j++) {
        let oneExists = false;
        let valid = true;
        for(let i=0; i<nRows; i++) {
            if (xMap[i][j]=='1') oneExists=true;
            else if (xMap[i][j]=='0') {
                valid = false;
                break;
            }
        }
        if (oneExists && valid) map4Ver[j] = 1;
        else map4Ver[j] = 0;
    }
    map4Ver[nCols] = map4Ver[0];

    console.log(map4Hor)
    console.log(map4Ver)

    selected = []; // nRows x nCols array 
    // initializing with false value
    for(let i=0; i<nRows; i++){ selected[i]=[]; for(let j=0; j<nCols; j++){selected[i][j]=0} }

    function pushIfNotSelected(si, sj, di, dj) {
        // source i, j ;  dest i, j

        // at least one of the cell that is '1' must be not selected. 
        let flag = false; // assume all are already seleted
        outerLoop: for(let i=si; i<=di; i++) {
            for(let j=sj; j<=dj; j++) {
                let mi = i%nRows;
                let mj = j%nCols;
                if (xMap[mi][mj]==='1' && selected[mi][mj]==0) {  // found one that is not selected
                    flag = true;
                    break outerLoop;
                }
            }
        }

        if (flag) {
            for(let i=si; i<=di; i++) {
                for(let j=sj; j<=dj; j++) {
                    let mi = i%nRows;
                    let mj = j%nCols;
                    selected[mi][mj] += 1;
                }
            }
            groups.push([si, sj, di, dj]);
        }
    }

    // check for 16-group
    if (nVars==4) {
        let oneExists = false;
        let valid = true;
        outerLoop: for(let i=0; i<4; i++) {
            for(let j=0; j<4; j++) {
                if (xMap[i][j]=='1') oneExists=true;
                else if(xMap[i][j]=='0') {
                    valid=false;
                    break outerLoop;
                }
            }
        }
        if (oneExists && valid) pushIfNotSelected(0, 0, 3, 3);
    }

    // check for 8-group
    // horizontal 2x4
    if (nVars>=3) {
        for(let i=0; i<nRows; i++) {
            if (map4Hor[i] && map4Hor[i+1]) pushIfNotSelected(i, 0, i+1, 3);
        }
    }
    // vertical 2x4
    if (nVars==4) {
        for(let i=0; i<nCols; i++) {
            if (map4Ver[i] && map4Ver[i+1]) pushIfNotSelected(0, i, 3, i+1);
        }
    }

    // check for 4-group
    // horizontal 4-cell rows
    if (nVars>=3) {
        for(let i=0; i<nRows; i++) {
            if (map4Hor[i]) pushIfNotSelected(i, 0, i, 3);
        }
    }
    // vertical 4-cell columns
    if (nVars==4) {
        for(let i=0; i<nCols; i++) {
            if (map4Ver[i]) pushIfNotSelected(0, i, 3, i);
        }
    }

    // 2x2 boxes
    for(let i=0; i<nRows; i++) {
        for(let j=0; j<nCols; j++) {
            let oneExists = false;
            let valid = true;
            for(let k=0; k<2; k++) {
                for(let l=0; l<2; l++) {
                    if (xMap[i+k][j+l]=='1') oneExists = true;
                    else if (xMap[i+k][j+l]=='0') valid = false;
                }
            }
            if (oneExists && valid) pushIfNotSelected(i, j, i+1, j+1);
        }
    }

    // check for 2-group
    // 2x1 boxes
    for(let i=0; i<nRows; i++) {
        for(let j=0; j<nCols; j++) {
            if ((xMap[i][j]=='1' || xMap[i+1][j]=='1') && xMap[i][j]!='0' && xMap[i+1][j]!='0') pushIfNotSelected(i, j, i+1, j);
        }
    }

    // 1x2 boxes
    for(let i=0; i<nRows; i++) {
        for(let j=0; j<nCols; j++) {
            if ((xMap[i][j]=='1' || xMap[i][j+1]=='1') && xMap[i][j]!='0' && xMap[i][j+1]!='0') pushIfNotSelected(i, j, i, j+1);
        }
    }
    
    // check for 1-group
    for(let i=0; i<nRows; i++) {
        for(let j=0; j<nCols; j++) {
            // push if not already seleted
            if (xMap[i][j]==='1' && selected[i][j]===0) {
                selected[i][j] += 1;
                groups.push([i, j, i, j]);
            }
        }
    }


    // --- remove the redundant groups
    // debugger;
    toBeDeleted = []; // index of a group in groups that is to be deleted
    for(let i=groups.length-1; i>=0; i--) {
        // source i, j = si, sj     dest i, j = di, dj
        let si = groups[i][0], sj = groups[i][1], di = groups[i][2], dj = groups[i][3];
        // in this group, at least one vertex be such that it is seleted only one time.
        let flag = false;
        for(let j=si; j<=di; j++) {
            for(let k=sj; k<=dj; k++) {
                mi=j%nRows; mj=k%nCols;
                if (selected[mi][mj]==1) flag = true;
            }
        }
        if (flag==false) toBeDeleted.push(i);
    }
    for(const index of toBeDeleted) {
        groups.splice(index, 1);
    }

    console.log(groups);
}

function drawLine(x1, y1, x2, y2) {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawLines() {
    // vertical lines
    for(let i=0; i<nCols+1; i++) {
        drawLine(startX+i*cellSize, startY, startX+i*cellSize, startY+cellSize*nRows);
    }
    // horizontal lines
    for(let i=0; i<nRows+1; i++) {
        drawLine(startX, startY+i*cellSize, startX+cellSize*nCols, startY+i*cellSize);
    }

    drawLine(startX, startY, startX-35, startY-35);
}

function drawMap() {
    drawLines();
    // set font properties
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    ctx.font = "25px Calibri";
    ctx.fillText(rowVars, startX-32, startY-5);
    ctx.fillText(colVars, startX-5, startY-32);

    ctx.font = "30px Arial";
    // mid point of first sell
    const firstMidX = startX+cellSize/2;
    const firstMidY = startY+cellSize/2;

    for(let i=0; i<nRows; i++) {
        for(let j=0; j<nCols; j++) {
            let value = String(map[i*nCols +j]);
            ctx.fillText(value, firstMidX+j*cellSize, firstMidY+i*cellSize);
        }
    }

    ctx.font = "22px Calibri";
    for(let i=0; i<nRows; i++) {
        ctx.fillText(rowGrayCodes[i], startX-18, firstMidY+i*cellSize);
    }
    for(let i=0; i<nCols; i++) {
        ctx.fillText(colGrayCodes[i], firstMidX+i*cellSize, startY-15);
    }
}

function mainloop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    requestAnimationFrame(mainloop);
}

mainloop();


// handle mouse click events on canvas
canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left; 
    const my = event.clientY - rect.top;

    if (mx<startX || my<startY) return;

    // calculating in which row and column the mouse is clicked
    const row = Math.trunc((my-startY)/cellSize)
    const col = Math.trunc((mx-startX)/cellSize)
    // these are in 0-indexing

    if (row>=nRows || col>=nCols) return;

    // index of the cell on which mouse is clicked
    const cellIdx = row*nCols +col;
    if (event.button === 0) { // left click
        if (map[cellIdx] == '0') map[cellIdx] = '1';
        else if (map[cellIdx] == '1') map[cellIdx] = '0';
        else map[cellIdx] = '0'; // when left clicked on x value -> it changes to 0
    }
    else if(event.button === 2) { // right click
        if (map[cellIdx]=='x') map[cellIdx] = '1'; // when right clicked on x value -> it changes to 1
        else map[cellIdx] = 'x'; // it changes from 0 or 1 to x
    }
})

document.addEventListener('keydown', (event) => {
    if (event.key==='s') {
        solveKMap();
    }
})

// disabling right click context menu on canvas
canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // Prevents the context menu from appearing
});