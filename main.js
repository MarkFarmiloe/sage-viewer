const setDisplay = (el, value) => {
    el.setAttribute("display", value);
}

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

const myRequest = new Request("nav.json");

fetch(myRequest)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        loadNav(data);
    });

// onload = (e) => {
//     const t = document.getElementsByTagName("table")[0];
//     for (const child of t.children) {
//         if (child.tagName === 'THEAD') {
//             const tr = child.children[0]
//             for (const col of tr.children) {
//                 col.addEventListener("click", toggleSort);
//             }
//             break;
//         }
//     }
// }
