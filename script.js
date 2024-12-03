
/** @type HTMLCanvasElement */
const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext('2d');

const sopTextElement = document.getElementById("sopText");
const truthTableElement = document.getElementById("truthTable")

const cellSize = 80;
var startX = 70;
var startY = 70;

const grayCodes2 = ["0", "1"];
const graycodes4 = ["00", "01", "11", "10"];

var nRows = 2;      // no of rows
var nCols = 4;      // no of columns
var nVars = 3;      // no of variables in kmap
var nCells = 8;     // no of cells in kmap
var map = [];       // kmap values
var rowGrayCodes = [];
var colGrayCodes = [];
var rowVars = "";   // variables labeled for the rows 
var colVars = "";   // variables labeled for the columns   Ex: AB, CD,  A, BC, etc..
var varsStr = "";   // string of variables - "ABC"  "AB"
var mapIdx2BinIdx = [];
var binIdx2mapIdx = [];

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

    varsStr = rowVars+colVars;

    // calculating startX startY
    let width = canvas.width;
    let height = canvas.height;

    let mapWidth = nCols*cellSize;
    let mpaHeight = nRows*cellSize;

    startX = Math.trunc(width/2 - mapWidth/2)   +10     // +10 to "look" middle alligned - there are more elements on the left side
    startY = Math.trunc(height/2 - mpaHeight/2) +10

    groups = [];
    // creating an array -  k-map index to binary index
    // another array - bin index to k-map index
    mapIdx2BinIdx.length = 0;
    binIdx2mapIdx.length = 0;
    for(let i=0; i<nRows; i++) {
        for(let j=0; j<nCols; j++) {
            const grayCode = rowGrayCodes[i]+colGrayCodes[j];
            let binIdx = parseInt(grayCode, 2);
            let mapIdx = i*nCols+j;
            mapIdx2BinIdx[mapIdx] = binIdx;
            binIdx2mapIdx[binIdx] = mapIdx;
        }
    }

    nCells = nRows*nCols;
    map = Array(nCells).fill('0');

    shouldUpdateCanvas = true;
    sopTextElement.innerHTML = "SOP: 0";

    generateNewTruthTable();
    // FOR debugging
    // if (nVars==4) map = ['1', '0', '1', '0', '0', '1', '0', '1', '1', '0', '1', '0', '0', '1', '0', '1']
}
changeNVars(4);

function generateNewTruthTable() {
    //** @type HTMLTableElement */
    const table = truthTableElement;

    //** @type HTMLTableSectionElement */
    thead = table.querySelector("thead");

    thead.innerHTML = '';
    const headerRow = document.createElement("tr");

    headerRow.appendChild(document.createElement("th")); // one emptry cell
    for(let i=0; i<varsStr.length; i++) {
        const th = document.createElement("th");
        const editBox = document.createElement("input");
        editBox.type = "text";
        editBox.className = "tt-var-edit-box";
        editBox.value = varsStr[i];


        editBox.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                editBox.blur();
            }
            else if (event.key.length == 1) {
                const code = event.key.charCodeAt(0);
                if ((65<=code && code<=90) || (97<=code && code<=122)) {
                    event.preventDefault();
                    const val = event.key.toUpperCase();
                    if (updateVarsNames(i, val)) { // if update vars names success
                        editBox.value = val;
                    }
                }
            }
        })

        th.appendChild(editBox);
        headerRow.appendChild(th);
    }
    const td = document.createElement("th");
    td.textContent = "Out";
    headerRow.appendChild(td);

    thead.appendChild(headerRow);

    tbody = table.querySelector("tbody");
    tbody.innerHTML = "";
    let rows = nCells;
    for(let i=0; i<rows; i++) {
        const dataRow = document.createElement("tr");
        let td = document.createElement("td");
        td.textContent = i;
        dataRow.appendChild(td);
        const binStr = i.toString(2).padStart(nVars, '0');
        for(let j=0; j<nVars; j++) {
            const td = document.createElement("td");
            td.textContent = binStr[j];
            dataRow.appendChild(td);
        }

        // output cell
        td = document.createElement("td");
        let td_btn = document.createElement("button");
        td_btn.className = "tt-out-btn";
        td_btn.innerText = "0";

        td_btn.onclick = function() {
            const currVal = td_btn.innerText;
            let nextVal;
            if (currVal=='0') nextVal='1';
            else if (currVal=='1') nextVal='x';
            else if (currVal=='x') nextVal='0';
            changeMapCell(binIdx2mapIdx[i], nextVal);
        }

        td.appendChild(td_btn);

        dataRow.appendChild(td);

        tbody.appendChild(dataRow);
    }
}

function changeMapCell(mapIdx, value) {
    map[mapIdx] = String(value);
    shouldUpdateCanvas = true;
    let binIdx = mapIdx2BinIdx[mapIdx];
    const row = truthTableElement.rows[binIdx+1];
    const button = row.cells[nVars+1].querySelector("button");
    button.innerText = value;
    // when map cell value is changed, clear the groups array
    groups = [];
}

function updateVarsNames(idx, val) {
    if (idx<0 || idx>=varsStr.len || val.length!=1) return false;
    let subIdx = varsStr.indexOf(val);
    val = val.toUpperCase();

    if (subIdx!=-1) { // if already exists, then swap the values
        change(subIdx, varsStr[idx]);
        change(idx, val);
        const headerRow = truthTableElement.querySelector("thead tr");
        const subIdxEditBox = headerRow.childNodes[subIdx+1].firstChild;
        subIdxEditBox.value = varsStr[subIdx];
    }
    else change(idx, val);

    function change(idx, val) {
        varsStr = stringReplaceAt(varsStr, idx, val);
        if (idx<rowVars.length) {
            rowVars = stringReplaceAt(rowVars, idx, val);
        } else {
            colVars = stringReplaceAt(colVars, idx-rowVars.length, val);
        }
    }
    groups = []; // TODO:(less priority) - change this later - you don't actually need to recalculate k-map
    shouldUpdateCanvas = true;
    return true;
}

function stringReplaceAt(str, idx, val) {
    str = str.slice(0, idx) + val + str.slice(idx+1);
    return str;
}

var groups = []; // groups of boxes - claculated by sovleKMap()
function solveKMap() {
    // debugger;
    groups = [];
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

    var map4Hor = []; // map of blocks of 4-cell-horizontal - each element is an object
    // at i-th index, {oneExists: boolean, valid: boolean}
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
        map4Hor[i] = {oneExists, valid};
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
        map4Ver[j] = {oneExists, valid};
    }
    map4Ver[nCols] = map4Ver[0];

    console.log(map4Hor)
    console.log(map4Ver)

    var selected = []; // nRows x nCols array 
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
            // in the two horizontal strips - both must be valid and at least one strip has atleast one 1
            if ((map4Hor[i].valid && map4Hor[i+1].valid)
                && (map4Hor[i].oneExists || map4Hor[i+1].oneExists)) 
                    pushIfNotSelected(i, 0, i+1, 3);
        }
    }
    // vertical 2x4
    if (nVars==4) {
        for(let i=0; i<nCols; i++) {
            // same logic as above
            if ((map4Ver[i].valid && map4Ver[i+1].valid)
                && (map4Ver[i].oneExists || map4Ver[i+1].oneExists)) 
                    pushIfNotSelected(0, i, 3, i+1);
        }
    }

    // check for 4-group
    // horizontal 4-cell rows
    if (nVars>=3) {
        for(let i=0; i<nRows; i++) {
            if (map4Hor[i].oneExists && map4Hor[i].valid) pushIfNotSelected(i, 0, i, 3);
        }
    }
    // vertical 4-cell columns
    if (nVars==4) {
        for(let i=0; i<nCols; i++) {
            if (map4Ver[i].oneExists && map4Ver[i].valid) pushIfNotSelected(0, i, 3, i);
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

    console.log("Before deleting redundant groups")
    var dupGroups = Array.from(groups)
    console.log(dupGroups)
    // --- remove the redundant groups
    // debugger;
    nonRedGroups = []; // non redundant group or non-completely overlapping groups
    for(let i=groups.length-1; i>=0; i--) {
        // source i, j = si, sj     dest i, j = di, dj
        let si = groups[i][0], sj = groups[i][1], di = groups[i][2], dj = groups[i][3];
        // in this group, at least one cell(non-x value) be such that it is seleted only one time.
        // otherwise this group is redundant, remaining groups already cover all the cells of this group
        let flag = false;
        for(let j=si; j<=di; j++) {
            for(let k=sj; k<=dj; k++) {
                mi=j%nRows; mj=k%nCols;
                if (xMap[mi][mj]!='x' && selected[mi][mj]==1) flag = true;
            }
        }
        if (flag==true) {
            nonRedGroups.push(groups[i]);
        }
        else {
            // we deleting this particular group, so remove their count from 'selected'
            for(let j=si; j<=di; j++) {
                for(let k=sj; k<=dj; k++) {
                    mi=j%nRows; mj=k%nCols;
                    selected[mi][mj] -= 1;
                }
            }
        }
    }
    groups = nonRedGroups;
    // actually high priority groups appear first in 'groups' array, in nonRedGroups it gets reversed, so reverse again
    groups.reverse();

    var sopStr = "";
    var sopInnerHtml = "SOP: ";
    let idx = 0; // to keep track of index of group - used to color differently
    for (const group of groups) {
        let si = group[0], sj = group[1], di = group[2], dj = group[3];
        bitStrs = []; // bit strings of cells - rowgraycode + colgraycode (concatenation)
        for(let i=si; i<=di; i++) {
            for(let j=sj; j<=dj; j++) {
                mi = i%nRows; mj=j%nCols;
                bitStr = rowGrayCodes[mi]+colGrayCodes[mj];
                bitStrs.push(bitStr);
            }
        }
        // each bitStr length is = no. of Vars
        bitStrFlags = Array.from(bitStrs[0]);
        // this array will track the unchanged values in bitStrs of the present group
        // if the value at an index differs in bitstings, then that value is represented by z
        // the values that doesn't differ in all the bitstrings are as it is (0 or 1)
        for(bitStr of bitStrs) {
            for(let i=0; i<nVars; i++) {
                if (bitStr[i]!=bitStrFlags[i]) bitStrFlags[i] = 'z';
            }
        }
        console.log("bit String flags"); console.log(bitStrFlags);

        strTerm = "";
        for(let i=0; i<nVars; i++) {
            if (bitStrFlags[i]=='z') continue;
            strTerm += varsStr[i];

            if (bitStrFlags[i]=='0') strTerm += "'"; // ' for vars that are 0,  like A'B' etc.
        }
        // every variable changed in a group, that group is the whole map
        if (strTerm.length==0) strTerm = "1";

        if (sopStr.length>0) {
            sopStr += " + "+strTerm;
            sopInnerHtml += " + ";
        }
        else sopStr = strTerm;
        
        sopInnerHtml += `<span style="color: ${colors[idx]};">${strTerm}</span>`;
        idx++;
    }
    if (groups.length==0) sopInnerHtml += " 0";
    sopTextElement.innerHTML = sopInnerHtml;
    console.log(groups);
}

const colors = ['red', 'blue', 'green', 'orange', 'purple', 'brown', 'indigo', 'magenta'];

function drawKMapBoxes(groups) {
    var drawn = []; // no. of boxes have been drawn on drawn[i][j]; kind of similar to 'selected' matrix
    // drawn[i][j] - consider as bit string - if 0th bit is 1, it says that a box with offset 0 is drawn on drawn[i][j]
    // generally if some kth bit is 1 - it says that a box with offset k 
    // note that the acutal offset is not k  - it's calculated from k - like a +b*k
    
    for(let i=0; i<nRows; i++){drawn[i]=[]; for(let j=0; j<nCols; j++){drawn[i][j] = 0;}}

    let idx = 0; // no. of boxes drawn;   used to get differnt color
    ctx.lineWidth = 2;
    let outOff = 6; // out offset - no. of pixels off the k-map for over-expanding boxes
    for(const group of groups) {
        ctx.strokeStyle = colors[idx];
        let si = group[0], sj = group[1], di=group[2], dj=group[3];

        let max = findMaxAndUpdateDrawn(si, sj, di, dj);
        let cellX = startX + cellSize*sj;
        let cellY = startY + cellSize*si;
        let offset = 3 +4*max;

        if (di<nRows && dj<nCols) { // in 4x4 case - di<=3 && dj<=3
            // top left point of start cell
            let boxX = cellX +offset; // x-coord of top left of this box
            let boxY = cellY +offset; // y-coord ..
            let boxW = (dj-sj+1)*cellSize -2*offset; // width of this box- offset at left and right decreases this width
            let boxH = (di-si+1)*cellSize -2*offset; // height ..

            ctx.strokeRect(boxX, boxY, boxW, boxH);
        }
        // over extending boxes should be a little bit outside the box
        // right over-expanding case
        else if (di<nRows) { // for 4x4 case - di<=3
            console.log("right over expanding case")
            // right box
            ctx.beginPath();
            let strokeX = startX +nCols*cellSize +outOff;
            let strokeY = startY +si*cellSize +offset;
            // cellSize -offset will be the width from offset to the border of k-map
            // we add outOff also to make it overflow from the table
            let width = cellSize-offset +outOff;
            let height = (di-si+1)*cellSize -2*offset;
            ctx.moveTo(strokeX, strokeY);
            ctx.lineTo( (strokeX-=width),  (strokeY) );
            ctx.lineTo( (strokeX),  (strokeY+=height) );
            ctx.lineTo( (strokeX+=width),  (strokeY) );
            ctx.stroke();

            // left box
            ctx.beginPath();
            strokeX = startX -outOff;
            strokeY = startY +si*cellSize +offset;
            // width and height will be same here
            ctx.moveTo(strokeX, strokeY);
            ctx.lineTo( (strokeX+=width),  (strokeY) );
            ctx.lineTo( (strokeX),  (strokeY+=height) );
            ctx.lineTo( (strokeX-=width), (strokeY) );
            ctx.stroke();
        }
        // down over-expanding case
        else if (dj<nRows) { // for 4x4 case - dj<=3
            // bottom box
            ctx.beginPath();
            let strokeX = startX +sj*cellSize +offset;
            let strokeY = startY +nRows*cellSize +outOff;
            // same logic as previous case
            let width = (dj-sj+1)*cellSize -2*offset;
            let height = cellSize -offset +outOff;
            ctx.moveTo(strokeX, strokeY);
            ctx.lineTo( (strokeX), (strokeY-=height) );
            ctx.lineTo( (strokeX+=width), (strokeY) );
            ctx.lineTo( (strokeX), (strokeY+=height) );
            ctx.stroke();

            // top box
            ctx.beginPath();
            strokeX = startX +sj*cellSize +offset;
            strokeY = startY -outOff;
            ctx.moveTo(strokeX, strokeY);
            ctx.lineTo( (strokeX), (strokeY+=height) );
            ctx.lineTo( (strokeX+=width), (strokeY) );
            ctx.lineTo( (strokeX), (strokeY-=height) );
            ctx.stroke();
        }
        // both right & down over-expanding case  - 2x2 bottom-down box case
        else {
            let celloff = cellSize -offset +outOff; // cellsize and offsets
            // bottom-right
            ctx.beginPath();
            let strokeX = startX +nCols*cellSize +outOff;
            let strokeY = startY +si*cellSize +offset; // si = nRows-1
            ctx.moveTo(strokeX, strokeY);
            ctx.lineTo((strokeX-=celloff), (strokeY));
            ctx.lineTo((strokeX), (strokeY+=celloff));
            // bottom left
            ctx.moveTo((strokeX=startX+cellSize-offset), (strokeY));
            ctx.lineTo((strokeX), (strokeY-=celloff));
            ctx.lineTo((strokeX-=celloff), (strokeY));
            // top left
            ctx.moveTo((strokeX), (strokeY=startY+cellSize-offset));
            ctx.lineTo((strokeX+=celloff), (strokeY));
            ctx.lineTo((strokeX), (strokeY-=celloff));
            // top right
            strokeX = startX +sj*cellSize +offset; // sj = nCols -1
            ctx.moveTo(strokeX, strokeY);
            ctx.lineTo((strokeX), (strokeY+=celloff));
            ctx.lineTo((strokeX+=celloff), (strokeY));
            ctx.stroke();
        }

        idx++;
    }

    function findMaxAndUpdateDrawn(si, sj, di, dj) {
        // OR the all values from (si,sj) to (di, dj)
        // find the least significat bit that has value zero.
        let val = 0;
        for(let i=si; i<=di; i++) {
            for(let j=sj; j<=dj; j++) {
                let mi = i%nRows;
                let mj = j%nCols;
                val |= drawn[mi][mj];
            }
        }
        let lsbZero = 1; // least significant bit that has value zero
        // lsbZero is of this form ...00001000...  we have 1 at the position of lsb zero in val
        let idx = 0; // index of lsb zero
        let dupVal = val; 
        while( dupVal&1 == 1) {
            lsbZero = lsbZero<<1;
            idx++;
            dupVal = dupVal>>1;
        }
        // we will return idx (for offset value) - so update accordingly
        // all the current drawn elements should be updated with lsbZero bit
        for(let i=si; i<=di; i++) {
            for(let j=sj; j<=dj; j++) {
                let mi = i%nRows;
                let mj = j%nCols;
                drawn[mi][mj] = drawn[mi][mj] | lsbZero;
            }
        }
        return idx;
    }
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

function drawCanvas() {
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
    drawKMapBoxes(groups);
}

var shouldUpdateCanvas = true;
function mainloop() {
    if (shouldUpdateCanvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCanvas();
        shouldUpdateCanvas = false;
    }
    requestAnimationFrame(mainloop);
}

mainloop();

var lastChangedKMapCellValue = '0';

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
    let currVal = map[cellIdx];
    let nextVal;
    if (event.button === 0) { // left click
        if (currVal == '0') nextVal = '1';
        else if (currVal == '1') nextVal = '0';
        else nextVal = '0'; // when left clicked on x value -> it changes to 0
    }
    else if(event.button === 2) { // right click
        if (currVal=='x') nextVal = '1'; // when right clicked on x value -> it changes to 1
        else nextVal = 'x'; // it changes from 0 or 1 to x
    }
    changeMapCell(cellIdx, nextVal);
    lastChangedKMapCellValue = map[cellIdx];
})

canvas.addEventListener("mousemove", (event) => {
    if (event.buttons!=1 && event.buttons!=2) return;
    
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
    changeMapCell(cellIdx, lastChangedKMapCellValue);
})

document.addEventListener('keydown', (event) => {
    if (event.key==='Enter') {
        solveKMap();
        shouldUpdateCanvas = true;
    }
})

// event listener for kmap button
document.getElementById("solveKMapBtn")
    .addEventListener("click", (event) => {
        solveKMap();
        shouldUpdateCanvas = true;
    })

// disabling right click context menu on canvas
canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // Prevents the context menu from appearing
});

nVarsSelectMenu = document.getElementById("nVarsSelectMenu");
nVarsSelectMenu.addEventListener('change', (event) => {
    const value = parseInt(nVarsSelectMenu.value);
    changeNVars(value);
})