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
const toggleSort = (e) => {
    const th = e.target;
    console.log(th);
    const xs = th.attributes['x-sort']?.value
    console.log(xs);
    th.setAttribute('x-sort', (xs === "asc") ? "desc" : "asc");
}

const buildTHead = (fldInfos, layout) => {
    const thead = document.getElementById("thead");
    thead.innerHTML = ""; // may need to remove event listeners to avoid memory leak ???
    const tr = document.createElement("tr");
    layout.forEach(fld => {
        fi = fldInfos.find(item => item.Name === fld.Name);
        const th = document.createElement("th");
        th.setAttribute("scope", "col");
        th.innerText = fi.text;
        tr.appendChild(th);
        th.addEventListener("click", toggleSort);
    })
    thead.appendChild(tr);
    return;
}

const dateToString = v => {
    const d = new Date(0, 0, v - 1);
    return d.toLocaleDateString();
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

const buildTBody = (fldInfos, dataRows, layout) => {
    const idx = quickIndex(dataRows, layoutCmpFn(fldInfos, layout));
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = ""; // may need to remove event listeners to avoid memory leak ???
    const showRows = sublistByIdx(dataRows, idx);
    showRows.forEach(row => {
        const tr = document.createElement("tr");
        let i = 0;
        layout.forEach(fld => {
            fi = fldInfos.find(item => item.Name === fld.Name);
            i = fldInfos.findIndex(item => item.Name === fld.Name);
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

const loadGrid = key => {
    data = dataStore[key];
    const t = document.getElementById("data");
    buildTHead(data.fields, data.layout);
    buildTBody(data.fields, data.rows, data.layout);
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
                    pos = populate(keys, pos);
                }
            } else {
                if (pos >= start + count) break;
                if (pos >= start) sublist.push(arr[keys]);
                pos++;
            };
        }
        return pos;
    }
    populate(idx, 0);
    return sublist;
}


// Fetch data
fetch(new Request("nav.json"))
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        loadNav(data);
    });

const dataStore = {};

const fetchToDataStore = async (key, path, loadToGrid) => {
    const response = await fetch(path);
    const data = await response.json();
    dataStore[key] = data;
    if (loadToGrid) loadGrid(key);
}

fetchToDataStore("Customers", "Customers.json", true);
// fetchToDataStore("Suppliers", "Suppliers.json", false);

// setTimeout(() => loadGrid("Suppliers"), 5000);

const quickIndex = (array, cmpfn = (a, b) => a < b ? -1 : 1) => {
    const qsi = index => {
        if (index.length <= 1) { return index };
        const pivot = array[index[0]];
        const left = [], same = [index[0]], right = [];
        for (let i = 1; i < index.length; i++) {
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

// console.log(quickIndex([4, 7, 5, 3, 2]));
// const objList = [
//     { name: "John", age: 42 },
//     { name: "Mark", age: 43 },
//     { name: "John", age: 44 },
//     { name: "Keith", age: 45 },
//     { name: "Mark", age: 46 },
//     { name: "John", age: 41 }
// ];
// const objIdx = quickIndex(objList, (a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
// for (let i = 0; i < objIdx.length; i++) {
//     console.log(i, objIdx[i], objList[objIdx[i]]);
// }

const listByIdx = (arr, idx, count = 20, start = 0, pos = 0) => {
    for (let i = 0; i < idx.length; i++) {
        const keys = idx[i];
        if (Array.isArray(keys)) {
            if (pos + keys.length <= start) {
                pos += keys.length;
            } else {
                pos = listByIdx(arr, keys, count, start, pos);
            }
        } else {
            if (pos >= start + count) break;
            if (pos >= start) console.log(arr[keys]);
            pos++;
        };
    }
    return pos;
}

// listByIdx(objList, objIdx);
// console.log("x");
// listByIdx(objList, objIdx, 3, 1);
// console.log("x");
// listByIdx(objList, objIdx, 2, 3);
