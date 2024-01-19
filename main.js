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

const emptyTable = t => {
    // do we need to remove the eventlisteners first?
    while (t.firstChild) {
        t.firstChild.remove();
    }
}

const buildTHead = fldInfos => {
    const thead = document.createElement("thead");
    const tr = document.createElement("tr");
    fldInfos.forEach(fldInfo => { // <th scope="col">Band</th>
        const th = document.createElement("th");
        th.setAttribute("scope", "col");
        th.innerText = fldInfo.Name;
        tr.appendChild(th);
        th.addEventListener("click", toggleSort);
    })
    thead.appendChild(tr);
    return thead;
}

const dateToString = v => {
    const d = new Date(0, 0, v - 1);
    return d.toLocaleDateString();
}

const buildTBody = (fldInfos, dataRows) => {
    const tbody = document.createElement("tbody");
    dataRows.forEach(row => {
        const tr = document.createElement("tr");
        let i = 0;
        fldInfos.forEach(fldInfo => { // <th scope="col">Band</th>
            const v = row[i];
            const td = document.createElement("td");
            switch (fldInfo.DataType) {
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
            i++;
        })
        tbody.appendChild(tr);
    })
    return tbody;
}

const loadGrid = key => {
    data = dataStore[key];
    // console.log(data[0]);
    // console.log(data[1][0]);
    const t = document.getElementById("data");
    emptyTable(t);
    const thead = buildTHead(data[0]);
    t.appendChild(thead);
    const tbody = buildTBody(data[0], data[1]);
    t.appendChild(tbody);
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
fetchToDataStore("Suppliers", "Suppliers.json", false);

setTimeout(() => loadGrid("Suppliers"), 5000);

// const dataRequest = new Request("Customers.json");
// fetch(dataRequest)
//     .then(response => {
//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }
//         return response.json();
//     })
//     .then(data => {
//         dataStore.Customers = data;
//         loadGrid(data);
//     });
