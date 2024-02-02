let draggables = document.querySelectorAll('.draggable');
const droppables = document.querySelectorAll('.drag-location');

let followingElement = null;
let mouseInterval = null;
let animationInterval = null;
let parent = null;
let droppable = null;

const interval = 10;
const heightAnimation = 200;

let nextElement = null;

let mouse = {
    clientX: 0,
    clientY: 0
}

const changeHeight = (obj, offset) => {
    if(obj.style.height.length === 0)
    {
        obj.style.height = parseInt(obj.offsetHeight) + 'px';
    }
    obj.style.height = parseInt(obj.style.height) + offset + 'px';
}

const recalculateHeight = (obj) => {

    const children = obj.children;
    const gap = 16;

    let height = 0;

    for(const child of children)
    {
        height += parseInt(child.offsetHeight);
        height += gap;
    }

    height += 20;

    obj.style.height = height + 'px';
}

const addItem = (obj, item, afterElement = null) =>
{

    if(afterElement)
    {
        afterElement.parentNode.insertBefore(item, afterElement);
    }
    else
    {
        obj.append(item);
    }
    recalculateHeight(obj);
}

const removeItem = (item) => {
    const parent = item.parentNode;
    item.remove();
    recalculateHeight(parent);
}

droppables.forEach(area => {
    recalculateHeight(area);
    area.addEventListener('mouseover', () => {
        droppable = area;
    })

    area.addEventListener('mouseleave', (e) => {
        const selected = droppable.querySelectorAll('.selected-drop-area');
        if(!animationInterval)
        {
            selected.forEach(s => {
                removeItem(s);
            });
        }
        droppable = null;
    })
})

document.addEventListener('mousedown', (e) => {
    if(!followingElement)
    {
        draggables = document.querySelectorAll('.draggable');
        const draggablesArray = [...draggables];
        if(draggablesArray.includes(e.srcElement))
        {
            followingElement = e.target.cloneNode(true);
            followingElement.classList.add('isdragging');
            followingElement.style.position = 'absolute';

            const parentBounds = e.target.getBoundingClientRect();
            followingElement.style.top = parentBounds.top +  'px';
            followingElement.style.left = parentBounds.left + 'px';
            followingElement.style.width = e.target.offsetWidth + 'px';

            document.querySelector('.container').insertBefore(followingElement, document.querySelector('.lanes'));
            
            parent = e.target.parentNode;
            
            e.target.classList.add('draggable-no-events');
            e.target.classList.add('selected-drop-area');
            e.target.classList.remove('draggable');
            e.target.innerHTML = '&#20';
            e.target.classList.remove('isdragging');
            e.target.classList.remove('draggable');
            e.target.style.position = 'static';
            e.target.style.width = '100%';
            e.target.style.transform = 'rotate(0deg)';
            e.target.style.height = followingElement.offsetHeight + 'px';

            mouse.clientX = e.clientX;
            mouse.clientY = e.clientY;

            nextElement = getNextElement(droppable, e.clientY);
        }
    }

    if(followingElement)
    {
        if(!animationInterval)
        {
            mouseInterval = setInterval(() => {
                if(followingElement)
                {
                    document.body.style.cursor = 'grabbing';
                    const left = parseInt(followingElement.style.left);
                    const xOffset = mouse.clientX - left - followingElement.offsetWidth / 2;
                    const lerpAmount = interval / 100;
            
                    let degree = lerp(xOffset / 2, 0.1, lerpAmount);
                    const degreeSnap = 2;
                    if((degree > 0 && degree < degreeSnap) || (degree < 0 && degree > -degreeSnap))
                    {
                        degree = 0;
                    }
                    followingElement.style.transform = "rotate(" + degree + "deg)";
                    
                    const topDistance = lerp(parseInt(followingElement.style.top), mouse.clientY, lerpAmount);
                    const leftDistance = lerp(parseInt(followingElement.style.left), mouse.clientX - followingElement.offsetWidth / 2, lerpAmount);
                    followingElement.style.top = (topDistance > 1 ? topDistance : mouse.clientY) + 'px';
                    followingElement.style.left = (leftDistance > 1 ? leftDistance : mouse.clientX) + 'px';
                }
            }, interval);
        }
    }
});

let previousAfterElement = null;

document.addEventListener('mousemove', (e) => {
    mouse.clientX = e.clientX;
    mouse.clientY = e.clientY;

    if(followingElement && !animationInterval)
    {
        if(droppable)
        {
            const afterElement = getNextElement(droppable, mouse.clientY);
            let node = followingElement.cloneNode(false);
            node.classList.remove('isdragging');
            node.classList.remove('draggable');
            node.classList.add('draggable-no-events');
            node.classList.add('selected-drop-area');
            node.style.height = followingElement.offsetHeight + 'px';
            node.innerHTML = '&#20';
            node.style.position = 'static';
            node.style.width = '100%';
            node.style.transform = 'rotate(0deg)';

            const selected = droppable.querySelector('.selected-drop-area');

            if(selected)
            {
                if(afterElement && afterElement != previousAfterElement)
                {
                    
                    removeItem(selected);
                    if(afterElement && droppable.contains(afterElement))
                    {
                        addItem(droppable, node, afterElement);
                    }
                }
                else if(!afterElement && selected.nextSibling !== null)
                {
                    removeItem(selected);
                    addItem(droppable, node);
                }
            }
            else
            {
                if(afterElement && droppable.contains(afterElement))
                {
                    addItem(droppable, node, afterElement);
                }
                else
                {
                    addItem(droppable, node);
                }
            }
            previousAfterElement = afterElement;
        }
    }
})

document.addEventListener('mouseup', (e) => {
    if(followingElement)
    {
        let node = followingElement.cloneNode(true);
        node.classList.remove('isdragging');
        node.style.position = 'static';
        node.style.top = 0 + 'px';
        node.style.left = 0 + 'px';
        node.style.width = '100%';
        node.style.transform = 'rotate(0deg)';
        node.style.height = followingElement.offsetHeight + 'px';

        if(droppable != null)
        {
            const afterElement = getNextElement(droppable, mouse.clientY);

            const selected = droppable.querySelector('.selected-drop-area');

            const done = false;
            animationInterval = setInterval(() => {
                if(mouseInterval)
                {
                    clearInterval(mouseInterval);
                }

                const bounds = selected.getBoundingClientRect();
                const left = Math.round(bounds.left);
                const top = Math.round(bounds.top);

                const topComparison = followingElement.offsetTop - top;
                const leftComparison = followingElement.offsetLeft - left;
                const topValid = (topComparison >= 0 && topComparison <= 2) || (topComparison <= 0 && topComparison >= -2);
                const leftValid = (leftComparison >= 0 && leftComparison <= 2) || (leftComparison <= 0 && leftComparison >= -2)

                if(topValid && leftValid)
                {
                    if(selected)
                    {
                        removeItem(selected);
                    }

                    if(afterElement && droppable.contains(afterElement))
                    {
                        addItem(droppable, node, afterElement);
                    }
                    else
                    {
                        addItem(droppable, node);
                    }

                    document.body.style.cursor = 'pointer';
            
                    mouseInterval = -1;
                    parent = null;
                    nextElement = null;
                    mouse = {
                        clientX: 0,
                        clientY: 0
                    }
                    followingElement.remove();
                    followingElement = null;
                    clearInterval(animationInterval);
                    animationInterval = null;
                }
                else
                {                
                    const lerpAmount = interval / 100;

                    const currentDegree = parseFloat(followingElement.style.transform.replace('rotate(', ''));

                    let degree = lerp(currentDegree, 0, lerpAmount / 1.1);
                    const degreeSnap = 0.05;
                    if((degree > 0 && degree < degreeSnap) || (degree < 0 && degree > -degreeSnap))
                    {
                        degree = 0;
                    }
                    followingElement.style.transform = "rotate(" + degree + "deg)";

                    let Xdistance = (parseInt(followingElement.style.left) - left) * lerpAmount;
                    let Ydistance = (parseInt(followingElement.style.top)- top) * lerpAmount;

                    if(Math.abs(Xdistance) < 2)
                    {
                        if(Xdistance < 0)
                        {
                            Xdistance = -2;
                        }
                        else
                        {
                            Xdistance = 2;
                        }
                    }
                    if(Math.abs(Ydistance) < 2)
                    {
                        if(Ydistance < 0)
                        {
                            Ydistance = -2;
                        }
                        else
                        {
                            Ydistance = 2;
                        }
                    }

                    followingElement.style.left = parseInt(followingElement.style.left) - Xdistance + 'px';
                    followingElement.style.top = parseInt(followingElement.style.top) - Ydistance + 'px';
                }
            }, interval);
        }
        else
        {   
            if(nextElement)
            {
                addItem(parent, node, nextElement);
            }
            else
            {
                addItem(parent, node);
            }
            clearInterval(mouseInterval);
            document.body.style.cursor = 'pointer';
    
            mouseInterval = -1;
            parent = null;
            nextElement = null;
            mouse = {
                clientX: 0,
                clientY: 0
            }
            followingElement.remove();
            followingElement = null;
        }


    }
})

const lerp = (a, b, alpha) => {
    return a + ( b - a ) * alpha;
}

const getNextElement = (dropLocation, y) => {
    const elements = [...dropLocation.querySelectorAll('.draggable:not(.isdragging):not(.selected-drop-area)')];

    const element = elements.reduce((closest, current) => {
        const currentBounds = current.getBoundingClientRect();
        const currentDistance = y - currentBounds.top - currentBounds.height / 2;
        if(currentDistance < 0 && closest.offset < currentDistance)
        {
            return {offset: currentDistance, element: current};
        }
        else
        {
            return closest
        }
    }, { offset: Number.MIN_SAFE_INTEGER }).element;

    return element;
}