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
    a.href = "/" + dataConfig.dataset + item.href;
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
const buildTHead = (data) => {
    const toggleSort = (e) => {
        const th = e.target;
        console.log(e);
        const asc = !e.shiftKey;
        const append = e.ctrlKey;
        const fldNo = th.attributes['x-fldno'].value;
        if (append) {
            // first remove it from the currentIdx, if present
            const newSorts = data.currentIdx.filter(([fldno, _]) => fldno != fldNo);
            newSorts.push([fldNo, asc]);
            data.currentIdx = newSorts;
        } else {
            data.currentIdx = [[fldNo, asc]];
        }
        renderGrid();
    }
    const thead = document.getElementById("thead");
    thead.innerHTML = ""; // may need to remove event listeners to avoid memory leak ???
    if (data) {
        const tr = document.createElement("tr");
        data.currentFields.forEach(fldno => {
            const fi = data.fields[fldno];
            const th = document.createElement("th");
            th.setAttribute("scope", "col");
            th.setAttribute("x-fldno", fldno);
            const sortIndex = data.currentIdx.findIndex(cf => cf[0] == fldno);
            // console.log(fldno, sortIndex);
            if (sortIndex >= 0) {
                const imgsrc = (data.currentIdx[sortIndex][1] ? "/asc" : "/desc") + ".png";
                th.innerHTML = fi.text + ' <img src="' + imgsrc + '"/><span>' + (1 + sortIndex) + "</span>";
            } else {
                th.innerHTML = fi.text;
            }
            tr.appendChild(th);
            th.addEventListener("click", toggleSort);
        });
        thead.appendChild(tr);
    }
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

const fetchIndex = (data) => {
    console.log(dataConfig);
    let idxKey = dataConfig.key;
    console.log(data);
    data.currentIdx.forEach(([fldno, asc]) => {
        idxKey += (asc ? "+" : "-") + fldno;
    });
    let index = dataStore[idxKey];
    if (!index) {
        index = quickIndex(data.rows, sortfn(data.currentIdx));
        dataStore[idxKey] = index;
    }
    return index;
}

const buildTBody = (data) => {
    const dateToString = v => {
        const d = new Date(0, 0, v - 1);
        return d.toLocaleDateString();
    }
    tbody.innerHTML = ""; // may need to remove event listeners to avoid memory leak ???
    if (data) {
        const idx = fetchIndex(data);
        const tbody = document.getElementById("tbody");
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
            tr.firstChild.addEventListener("click", (e) => {
                e.preventDefault();
                console.log(row[0], dataConfig);
                console.log(e);
                initialise("/" + (dataConfig.dataset ? dataConfig.dataset + "/" + (dataConfig.key ? dataConfig.key + "/" : "") : "") + row[0], "?");
            });
        })
    }
}

const buildTFoot = (data) => {
    const selectPage = (e) => {
        const pageNo = parseInt(e.target.innerText);
        if (!isNaN(pageNo)) {
            dataConfig.pageNo = pageNo;
            buildTBody(data);
            buildTFoot(data);
        }
    }
    const tfoot = document.getElementById("tfoot");
    tfoot.innerHTML = ""; // may need to remove event listeners to avoid memory leak ???
    if (data && dataConfig.noOfPages > 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = data.fields.length;
        const ul = document.createElement("ul");
        let firstPageNo = Math.max(1, dataConfig.pageNo - 4);
        const lastPageNo = Math.min(firstPageNo + 8, dataConfig.noOfPages);
        if (lastPageNo === dataConfig.noOfPages) {
            firstPageNo = Math.max(1, lastPageNo - 8);
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
        tfoot.appendChild(tr);
    }
}


const clearGrid = () => {
    document.getElementById("thead").innerHTML = ""; // may need to remove event listeners to avoid memory leak ???
    document.getElementById("tbody").innerHTML = ""; // may need to remove event listeners to avoid memory leak ???
    document.getElementById("tfoot").innerHTML = ""; // may need to remove event listeners to avoid memory leak ???
}

const renderGrid = () => {
    if (dataConfig.key) {
        const data = dataStore[dataConfig.key];
        if (data.rows.length && dataConfig.pageSize < data.rows.length) {
            dataConfig.noOfPages = 1 + Math.trunc((data.rows.length - 1) / dataConfig.pageSize);
        } else {
            dataConfig.noOfPages = 0;
        }
        buildTHead(data);
        buildTBody(data);
        buildTFoot(data);
    } else {
        clearGrid();
    }
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
    const sorts = [];
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

const fetchData = async (key, path) => {
    const cached = dataStore[key];
    if (cached && cached.path === path) {
        return cached;
    }
    const response = await fetch(path, { headers: { "Accept": "application/json" } });
    const data = await response.json();
    data.path = path;
    [data.currentFields, data.currentIdx] = fromLayout(data.fields, data.layout);
    dataStore[key] = data;
    return data;
    // if (loadToGrid) {
    //     if (key) {
    //         dataConfig.key = key;

    //         dataConfig.pageNo = 1;
    //         dataConfig.pageSize = 25;
    //         dataConfig.noOfPages = 1 + Math.round((data.rows.length - 1) / dataConfig.pageSize);
    //         renderGrid();
    //     }
    // }
}

// Fetch data
const dataStore = {};
const dataConfig = {
    dataset: "",
    key: "",
    pageNo: 1,
    pageSize: 25,
    noOfPages: 0
};

const configToUrl = () => {
    let url = "/" + (dataConfig.dataset || "") + (dataConfig.key ? "/" + dataConfig.key : "");
    if (data.currentIdx) {
        url += "?s=";
        data.currentIdx.forEach(([f, a]) => {
            url += (a ? "+" : "-") + (f + 1);
        });
    }
    if (dataConfig.noOfPages > 0) {
        url += data.currentIdx ? "&" : "?";
        url += "pn=" + dataConfig.pageNo + "&ps=" + dataConfig.pageSize;
    }
    return url;
};

const urlToConfig = (base, q) => {
    const [_, dataset, key, params] = base.split("/", 3);
    const query = {};
    if (q) {
        const qParts = q.substring(1).split("&");
        qParts.forEach(qPart => {
            const kv = qPart.split("=");
            query[kv[0]] = kv[1];
        });
    }
    const pageNo = query["pn"] ?? 1;
    const pageSize = query["ps"] ?? 25;
    let currentIdx = null;
    if (query["s"]) {
        currentIdx = [];
        const sParts = query["s"].split(/(\d+)/)
        for (let i = 0; i < sParts.length - 1; i += 2) {
            currentIdx.push([sParts[i + 1], sParts[i] === "+"]);
        }
        return { dataset, key, params, pageNo, pageSize, currentIdx };
    }
    return { dataset, key, params, pageNo, pageSize };
}

const initialise = (pathname, search) => {
    console.log(pathname, search);
    const config = urlToConfig(pathname, search);
    console.log(config);
    Object.assign(dataConfig, config);
    console.log(dataConfig);
    if (dataConfig.dataset === "" || dataConfig.dataset === "datasets") {
        dataConfig.dataset = "";
        dataConfig.key = "datasets";
        fetchData("datasets", "/datasets")
            .then(() => renderGrid());
    } else {
        fetch(new Request("/" + dataConfig.dataset + "/nav", { headers: { "Accept": "application/json" } }))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                loadNav(data);
            });
        if (dataConfig.key === "datasets") { dataConfig.key = "" };
        history.pushState("", "", configToUrl());
        if (dataConfig.key) {
            fetchData(dataConfig.key, "/" + dataConfig.dataset + "/" + dataConfig.key)
                .then(() => renderGrid());
        } else {
            data = null;
            renderGrid();
        }
    }
}

initialise(document.location.pathname, document.location.search);
