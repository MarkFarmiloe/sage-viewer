// Load navbar
const buildMenuItem = item => {
    const li = document.createElement("li");
    li.addEventListener("mouseover", (e) => {
        li.classList.add("active");
    });
    li.addEventListener("mouseleave", () => {
        li.classList.remove("active");
    });
    const a = document.createElement("a");
    a.href = item.href;
    a.innerText = item.text;
    li.appendChild(a);
    if (item.children) {
        const ul = document.createElement("ul");
        item.children.forEach(child => {
            const subMenuItem = buildMenuItem(child);
            ul.appendChild(subMenuItem);
        })
        li.appendChild(ul);
    }
    return li;
}

const loadNav = data => {
    const n = document.getElementById("main-menu");
    const ul = document.createElement("ul");
    data.forEach(item => {
        const menuItem = buildMenuItem(item);
        ul.appendChild(menuItem)
    });
    const fc = n.firstChild;
    n.insertBefore(ul, fc);
}

// Load grid
const buildTHead = () => {
    const toggleSort = (e) => {
        const th = e.target;
        console.log(e);
        const asc = !e.shiftKey;
        const append = e.ctrlKey;
        const fldNo = th.attributes['x-fldno'].value;
        if (append) {
            // first remove it from the currentIdx, if present
            const newSorts = dataConfig.currentIdx.filter(([fldno, _]) => fldno != fldNo);
            newSorts.push([fldNo, asc]);
            dataConfig.currentIdx = newSorts;
        } else {
            dataConfig.currentIdx = [[fldNo, asc]];
        }
        loadGrid();
    }
    const data = dataStore[dataConfig.key];
    const thead = document.getElementById("thead");
    thead.innerHTML = ""; // may need to remove event listeners to avoid memory leak ???
    const tr = document.createElement("tr");
    dataConfig.currentFields.forEach(fldno => {
        const fi = data.fields[fldno];
        const th = document.createElement("th");
        th.setAttribute("scope", "col");
        th.setAttribute("x-fldno", fldno);
        const sortIndex = dataConfig.currentIdx.findIndex(cf => cf[0] == fldno);
        console.log(fldno, sortIndex);
        if (sortIndex >= 0) {
            const imgsrc = "assets/" + (dataConfig.currentIdx[sortIndex][1] ? "asc" : "desc") + ".png";
            th.innerHTML = fi.text + ' <img src="' + imgsrc + '"/><span>' + (1 + sortIndex) + "</span>";
        } else {
            th.innerHTML = fi.text;
        }
        tr.appendChild(th);
        th.addEventListener("click", toggleSort);
    });
    thead.appendChild(tr);
    return;
}

const sortfn = sorts => {
    const cmpFn = (a, b) => {
        for (let i = 0; i < sorts.length; i++) {
            const [fldno, asc] = sorts[i];
            if (a[fldno] < b[fldno]) {
                return asc ? -1 : 1;
            }
            if (a[fldno] > b[fldno]) {
                return asc ? 1 : -1;
            }
        }
        return 0;
    };
    return cmpFn;
}

const fetchIndex = () => {
    let idxKey = dataConfig.key;
    dataConfig.currentIdx.forEach(([fldno, asc]) => {
        idxKey += (asc ? "+" : "-") + fldno;
    });
    let index = dataStore[idxKey];
    if (!index) {
        const data = dataStore[dataConfig.key];
        index = quickIndex(data.rows, sortfn(dataConfig.currentIdx));
        dataStore[idxKey] = index;
    }
    return index;
}

const buildTBody = () => {
    const dateToString = v => {
        const d = new Date(0, 0, v - 1);
        return d.toLocaleDateString();
    }
    const data = dataStore[dataConfig.key];
    const idx = fetchIndex();
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = ""; // may need to remove event listeners to avoid memory leak ???
    const showRows = sublistByIdx(data.rows, idx, dataConfig.pageSize, (dataConfig.pageNo - 1) * dataConfig.pageSize);
    showRows.forEach(row => {
        const tr = document.createElement("tr");
        let i = 0;
        data.layout.forEach(fld => {
            fi = data.fields.find(item => item.Name === fld.Name);
            i = data.fields.findIndex(item => item.Name === fld.Name);
            const v = row[i];
            const td = document.createElement("td");
            switch (fi.DataType) {
                case "String":
                    td.innerText = v;
                    break;
                case "Int":
                    td.innerText = v.toString();
                    td.classList.add("n0");
                    break;
                case "Money":
                    td.innerText = v.toFixed(2);
                    td.classList.add("n2");
                    break;
                case "Date":
                    td.innerText = dateToString(v);
                    td.classList.add("date");
                    break;
                default:
                    break;
            }
            tr.appendChild(td);
            // i++;
        })
        tbody.appendChild(tr);
    })
    return;
}

const buildTFoot = () => {
    const selectPage = (e) => {
        const pageNo = parseInt(e.target.innerText);
        if (!isNaN(pageNo)) {
            dataConfig.pageNo = pageNo;
            buildTBody();
            buildTFoot();
        }
    }
    const data = dataStore[dataConfig.key];
    const tfoot = document.getElementById("tfoot");
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = data.fields.length;
    const ul = document.createElement("ul");
    let firstPageNo = Math.max(1, dataConfig.pageNo - 4);
    const lastPageNo = Math.min(firstPageNo + 8, dataConfig.noOfPages);
    if (lastPageNo === dataConfig.noOfPages) {
        firstPageNo = lastPageNo - 8;
    }
    if (firstPageNo > 1) {
        const li = document.createElement("li");
        li.innerText = 1;
        li.addEventListener("click", selectPage);
        ul.appendChild(li);
        if (firstPageNo > 2) {
            const li = document.createElement("li");
            li.classList.add("elipsis");
            li.innerText = "...";
            ul.appendChild(li);
        }
    }
    for (let i = firstPageNo; i <= lastPageNo; i++) {
        const li = document.createElement("li");
        li.innerText = i;
        if (i === dataConfig.pageNo) { li.classList.add("selected") };
        li.addEventListener("click", selectPage);
        ul.appendChild(li);
    }
    if (dataConfig.noOfPages > lastPageNo) {
        if (dataConfig.noOfPages > lastPageNo + 1) {
            const li = document.createElement("li");
            li.classList.add("elipsis");
            li.innerText = "...";
            ul.appendChild(li);
        }
        const li = document.createElement("li");
        li.innerText = dataConfig.noOfPages;
        li.addEventListener("click", selectPage);
        ul.appendChild(li);
    }
    td.appendChild(ul);
    tr.appendChild(td);
    tfoot.innerHTML = ""; // may need to remove event listeners to avoid memory leak ???
    tfoot.appendChild(tr);
    return;
}

const loadGrid = () => {
    data = dataStore[dataConfig.key];
    const t = document.getElementById("data");
    buildTHead(data.fields, data.layout);
    buildTBody();
    buildTFoot();
}

const sublistByIdx = (arr, idx, count = 25, start = 0) => {
    const sublist = [];
    const populate = (keys, pos) => {
        for (let i = 0; i < idx.length; i++) {
            const keys = idx[i];
            if (Array.isArray(keys)) {
                if (pos + keys.length <= start) {
                    pos += keys.length;
                } else {
                    for (let j = 0; j < keys.length; j++) {
                        if (pos >= start + count) return;
                        if (pos >= start) sublist.push(arr[keys[j]]);
                        pos++;                                
                    }
                }
            } else {
                if (pos >= start + count) return;
                if (pos >= start) sublist.push(arr[keys]);
                pos++;
            };
        }
    }
    populate(idx, 0);
    return sublist;
}

const quickIndex = (array, cmpfn = (a, b) => a < b ? -1 : 1) => {
    const qsi = index => {
        if (index.length <= 1) { return index };
        const pivot = array[index[Math.floor(index.length / 2)]];
        const left = [], same = [], right = [];
        for (let i = 0; i < index.length; i++) {
            const j = index[i];
            const testResult = cmpfn(array[j], pivot);
            if (testResult < 0) { left.push(j) }
            else if (testResult > 0) { right.push(j) }
            else { same.push(j) };
        }
        if (same.length === 1) {
            return qsi(left).concat(same).concat(qsi(right));
        }
        return qsi(left).concat([same]).concat(qsi(right));
    }
    const index = Array.from({ length: array.length }, (_, i) => i);
    return qsi(index);
}

const layoutCmpFn = (fldInfos, layout) => {
    const sorts = [], asc = [];
    layout.forEach(item => {
        if (item.Sort) {
            const num = Math.abs(item.Sort) - 1;
            const asc = Math.sign(item.Sort) === 1;
            const fi = fldInfos.find(fi => fi.Name === item.Name);
            const i = fldInfos.findIndex(fi => fi.Name === item.Name);
            sorts[num] = [i, fi, asc];
        }
    });
    const cmpFn = (a, b) => {
        for (let i = 0; i < sorts.length; i++) {
            const [pos, _, asc] = sorts[i];
            if (a[pos] < b[pos]) {
                return asc ? -1 : 1;
            }
            if (a[pos] > b[pos]) {
                return asc ? 1 : -1;
            }
        }
        return 0;
    };
    return cmpFn;
}

const fromLayout = (fldInfos, layout) => {
    const fieldNos = [], sorts = [];
    layout.forEach(item => {
        const i = fldInfos.findIndex(fi => fi.Name === item.Name);
        fieldNos.push(i);
        if (item.Sort) {
            const num = Math.abs(item.Sort) - 1;
            const asc = Math.sign(item.Sort) === 1;
            sorts[num] = [i, asc];
        }
    });
    console.log(fieldNos, sorts);
    return [fieldNos, sorts];
}

const fetchToDataStore = async (key, path, loadToGrid) => {
    const response = await fetch(path);
    const data = await response.json();
    dataStore[key] = data;
    if (loadToGrid) {
        dataConfig.key = key;
        [dataConfig.currentFields, dataConfig.currentIdx] = fromLayout(data.fields, data.layout);
        dataConfig.pageNo = 1;
        dataConfig.pageSize = 25;
        dataConfig.noOfPages = 1 + Math.round((data.rows.length - 1) / dataConfig.pageSize);
        loadGrid();
    }
}

// Fetch data
const server = "http://127.0.0.1:3000/";
const dataset = "ageuk23-24/";
const dataStore = {};
const dataConfig = {
    key: "",
    currentFields: [],
    currentIdx: null,
    pageNo: 0,
    pageSize: 25,
    noOfPages: 0
};

fetch(new Request(server + dataset + "nav"))
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        loadNav(data);
    });

fetchToDataStore("Customers", server + dataset + "Customers", true);
