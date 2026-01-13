let familyTree = JSON.parse(localStorage.getItem("familyTree")) || [];

const tree = document.getElementById("tree");
const svg = document.getElementById("lines");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const nameInput = document.getElementById("name-input");
const birthInput = document.getElementById("birth-input");

const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");
const cancelBtn = document.getElementById("cancel-btn");

const addRootBtn = document.getElementById("add-root");

let modalAction = null;
let deleteAction = null;

/* ---------- МОДАЛКА ---------- */
function openModal(title, data={}, onSave, onDelete=null){
    modalTitle.textContent = title;
    nameInput.value = data.name||"";
    birthInput.value = data.birth||"";
    modalAction=onSave;
    deleteAction=onDelete;
    deleteBtn.style.display = onDelete?"inline-block":"none";
    modal.classList.add("active");
}

function closeModal(){ modal.classList.remove("active"); }

cancelBtn.onclick = closeModal;
saveBtn.onclick = ()=>{
    modalAction({name:nameInput.value,birth:birthInput.value});
    saveAndRender();
    closeModal();
};
deleteBtn.onclick = ()=>{
    if(deleteAction) deleteAction();
    saveAndRender();
    closeModal();
};

/* ---------- СОХРАНЕНИЕ ---------- */
function saveAndRender(){
    localStorage.setItem("familyTree", JSON.stringify(familyTree));
    renderTree();
}

/* ---------- ОТРИСОВКА ---------- */
function renderTree(){
    tree.innerHTML="";
    svg.innerHTML=`<defs>
        <marker id="arrow-down" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="#4f46e5"/>
        </marker>
        <marker id="arrow-right" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="#f43f5e"/>
        </marker>
    </defs>`;

    familyTree.forEach(root=>{
        const branch = document.createElement("div");
        branch.className="branch";
        renderPersons([root], branch);
        tree.appendChild(branch);
    });
    requestAnimationFrame(drawLines);
}

function renderPersons(list,parent){
    const ul=document.createElement("ul");
    list.forEach(person=>{
        const li=document.createElement("li");

        const p=document.createElement("span");
        p.className="person";
        p.dataset.id=person.id;
        p.innerHTML=`${person.name}<span class="birth">${person.birth||""}</span>`;
        li.appendChild(p);

        // Кнопки
        const edit=document.createElement("button");
        edit.className="btn-edit"; edit.textContent="✏️";
        edit.onclick=()=>openModal("Редактировать человека", person,
            data=>Object.assign(person,data),
            ()=>removePerson(person.id));

        const addChild=document.createElement("button");
        addChild.className="btn-add"; addChild.textContent="+ ребёнок";
        addChild.onclick=()=>openModal("Добавить ребёнка", {}, data=>{
            person.children.push({id:Date.now(), ...data, spouse:null, children:[]});
        });

        const addSpouse=document.createElement("button");
        addSpouse.className="btn-spouse"; addSpouse.textContent="❤️ супруг/а";
        addSpouse.onclick=()=>openModal("Добавить супруга/супругу", person.spouse||{}, data=>{
            person.spouse=data;
        });

        li.append(edit, addChild, addSpouse);

        // Супруг
        if(person.spouse){
            const s=document.createElement("span");
            s.className="spouse"; s.dataset.id=person.id+"-spouse";
            s.innerHTML=`${person.spouse.name}<span class="birth">${person.spouse.birth||""}</span>`;
            li.appendChild(s);
        }

        if(person.children.length) renderPersons(person.children, li);
        ul.appendChild(li);
    });
    parent.appendChild(ul);
}

/* ---------- УДАЛЕНИЕ ---------- */
function removePerson(id,list=familyTree){
    for(let i=0;i<list.length;i++){
        if(list[i].id===id){ list.splice(i,1); return true;}
        if(removePerson(id,list[i].children)) return true;
    }
}

/* ---------- ЛИНИИ ---------- */
function drawLines(){
    svg.setAttribute("width", tree.scrollWidth);
    svg.setAttribute("height", tree.scrollHeight);

    svg.querySelectorAll("path").forEach(p=>p.remove());

    document.querySelectorAll(".person").forEach(pEl=>{
        const person = findPerson(pEl.dataset.id);

        // дети
        person.children.forEach(child=>{
            const cEl = document.querySelector(`.person[data-id='${child.id}']`);
            if(cEl) drawArrowVertical(pEl,cEl);
        });

        // супруг
        if(person.spouse){
            const sEl = document.querySelector(`.spouse[data-id='${person.id}-spouse']`);
            if(sEl) drawArrowHorizontal(pEl,sEl);
        }
    });
}

function drawArrowVertical(fromEl,toEl){
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    const s = svg.getBoundingClientRect();

    const x1 = a.left + a.width/2 - s.left;
    const y1 = a.bottom - s.top;
    const x2 = b.left + b.width/2 - s.left;
    const y2 = b.top - s.top;
    const midY = (y1+y2)/2;

    const path = document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d",`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`);
    path.setAttribute("stroke","#4f46e5");
    path.setAttribute("fill","none");
    path.setAttribute("stroke-width","2");
    path.setAttribute("marker-end","url(#arrow-down)");
    svg.appendChild(path);
}

function drawArrowHorizontal(fromEl,toEl){
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    const s = svg.getBoundingClientRect();

    const x1 = a.right - s.left;
    const y1 = a.top + a.height/2 - s.top;
    const x2 = b.left - s.left;
    const y2 = b.top + b.height/2 - s.top;
    const midX = (x1+x2)/2;

    const path = document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d",`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`);
    path.setAttribute("stroke","#f43f5e");
    path.setAttribute("fill","none");
    path.setAttribute("stroke-width","2");
    path.setAttribute("marker-end","url(#arrow-right)");
    svg.appendChild(path);
}

/* ---------- ПОИСК ---------- */
function findPerson(id,list=familyTree){
    for(const p of list){
        if(p.id==id) return p;
        const f = findPerson(id,p.children);
        if(f) return f;
    }
}

/* ---------- ПРАРОДИТЕЛЬ ---------- */
addRootBtn.onclick = ()=> openModal("Добавить прародителя", {}, data=>{
    familyTree.push({id:Date.now(), ...data, spouse:null, children:[]});
});

renderTree();
window.addEventListener("resize", drawLines);
