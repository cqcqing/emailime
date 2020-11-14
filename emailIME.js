(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./emailIME.css'], factory);
    } else if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = global.document ? factory() : function () {
            throw new Error("emailIME requires a window with a document");
        };
    } else {
        factory();
    }
})(typeof window !== "undefined" ? window : this, function () {
    loadStyles('./emailIME.css')

    function loadStyles(url) {
        var link = document.createElement('link')
        link.rel = 'stylesheet'
        link.type = 'text/css'
        link.href = url
        var head = document.getElementsByTagName("head")[0]
        head.appendChild(link)
    }

    var EventUtil = {
        addHandler: function (element, type, handler) {
            if (element.addEventListener) {
                element.addEventListener(type, handler, false);
            } else if (element.attachEvent) {
                element.attachEvent("on" + type, handler);
            } else {
                element['on' + type] = handler;
            }
            return {element: element, type: type, handler: handler}
        }, removeHandler: function (element, type, handler) {
            if (element.removeEventListener) {
                element.removeEventListener(type, handler, false);
            } else if (element.detachEvent) {
                element.detachEvent("on" + type, handler);
            } else {
                element['on' + type] = null;
            }
        }, getEvent: function (event) {
            return event ? event : window.event;
        }, getTarget: function (event) {
            return event.target ? event.target : event.srcElement;
        }, preventDefault: function (event) {
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        }, stopPropagation: function (event) {
            if (event.stopPropagation) {
                event.stopPropagation();
            } else {
                event.cancelBubble = true;
            }
        }
    }

    function ItemObj(node, itemListeners, inputListeners, separatorListeners) {
        this.id = node
        this.itemListeners = itemListeners || []
        this.inputListeners = inputListeners || []
        this.separatorListeners = separatorListeners || []
    }

    ItemObj.prototype = {
        constructor: ItemObj, removeItemListener: function () {
            this.itemListeners.forEach(function (item) {
                EventUtil.removeHandler(item.element, item.type, item.handler)
            })
            this.itemListeners = []
        }, removeInputListener: function () {
            this.inputListeners.forEach(function (item) {
                EventUtil.removeHandler(item.element, item.type, item.handler)
            })
            this.inputListeners = []
        }, removeSeparatorListener: function () {
            this.separatorListeners.forEach(function (item) {
                EventUtil.removeHandler(item.element, item.type, item.handler)
            })
            this.separatorListeners = []
        }, removeAllListener: function () {
            this.removeSeparatorListener()
            this.removeInputListener()
            this.removeItemListener()
        }
    }

    function ItemObjArray() {
    }

    ItemObjArray.prototype = new Array()
    ItemObjArray.prototype.constructor = Array
    ItemObjArray.prototype.filter = function (callback) {
        var i, len, result = new ItemObjArray()
        for (i = 0, len = this.length; i < len; i++) {
            callback(this[i], i, this) && result.push(this[i])
        }
        return result
    }
    ItemObjArray.prototype.indexOfId = function (id) {
        var i, len, index = -1
        for (i = 0, len = this.length; i < len; i++) {
            if (this[i].id === id) {
                index = i
                break
            }
        }
        return index
    }

    function EventTarget() {
        this.handlers = {}
    }

    EventTarget.prototype = {
        constructor: EventTarget, addHandler: function (type, handler) {
            if (typeof this.handlers[type] === "undefined") {
                this.handlers[type] = []
            }
            this.handlers[type].push(handler)
        }, fire: function (event) {
            if (!event.target) {
                event.target = this
            }
            if (this.handlers[event.type] instanceof Array) {
                var handlers = this.handlers[event.type]
                for (var i = 0, len = handlers.length; i < len; i++) {
                    handlers[i](event)
                }
            }
        }, removeHandler: function (type, handler) {
            if (this.handlers[type] instanceof Array) {
                var handlers = this.handlers[type]
                for (var i = 0, len = handlers.length; i < len; i++) {
                    if (handlers[i] === handler) {
                        break
                    }
                }
                handlers.splice(i, i)
            }
        }
    }
    var DragDrop = function () {
        var dragdrop = new EventTarget(), dragging = null

        function handlerEvent(event) {
            event = EventUtil.getEvent(event)
            var target = EventUtil.getTarget(event)
            switch (event.type) {
                case"mousedown":
                    if (target.className.indexOf("draggable") > -1 && isConChildEl(target)) {
                        if (event.button !== 0) {
                            return
                        }
                        dragging = document.createElement('div')
                        dragging.classList.add('virtualEl')
                        document.body.appendChild(dragging)
                        dragdrop.fire({type: "dragstart", target: target})
                    }
                    break
                case"mousemove":
                    if (dragging !== null) {
                        if (event.button !== 0) {
                            return
                        }
                        EventUtil.preventDefault(event)
                        dragging.style.left = event.clientX + 2 + documentEl.scrollLeft + 'px'
                        dragging.style.top = event.clientY + 2 + documentEl.scrollTop + 'px'
                        dragging.style.display = 'block'
                        dragdrop.fire({type: "drag", referEl: target, clientX: event.clientX, clientY: event.clientY})
                    }
                    break
                case"mouseup":
                    if (dragging) {
                        if (event.button !== 0) {
                            return
                        }
                        dragdrop.fire({type: "dragend", referEl: target, x: event.clientX, y: event.clientY})
                        document.body.removeChild(dragging)
                        EventUtil.stopPropagation(event)
                    }
                    dragging = null
                    break
            }
        }

        dragdrop.enable = function () {
            EventUtil.addHandler(document, "mousedown", handlerEvent)
            EventUtil.addHandler(document, "mousemove", handlerEvent)
            EventUtil.addHandler(document, "mouseup", handlerEvent)
        }
        dragdrop.disable = function () {
            EventUtil.removeHandler(document, "mousedown", handlerEvent)
            EventUtil.removeHandler(document, "mousemove", handlerEvent)
            EventUtil.removeHandler(document, "mouseup", handlerEvent)
        }
        return dragdrop
    }()

    function hasAt(text) {
        var pattern = /@/g;
        var result = pattern.test(text);
        return result
    }

    function isSeparator(char) {
        var pattern = /[,;，； ]/g;
        var result = pattern.test(char);
        return result
    }

    function isEmail(string) {
        var pattern = /^(?:\w+\.?)\w+@(?:\w+\.)+\w+$/;
        var result = string.match(pattern);
        return result
    }

    function input_resize(inputElement, value) {
        value = value || inputElement.value
        value = value.replace(/[ ]/g, "&nbsp;")
        calculatorSpan.innerHTML = value
        inputElement.style.fontSize = getComputedStyle(inputElement)['font-size']
        inputElement.style.width = calculatorSpan.clientWidth + 'px'
    }

    function addSeparatorSpan(curItemNode, itemObj) {
        var semicolonSpan = document.createElement('span')
        semicolonSpan.innerHTML = ";"
        semicolonSpan.classList.add('semicolon')
        semicolonSpan.classList.add('draggable')
        curItemNode.appendChild(semicolonSpan)
    }

    function addByCoord(emailContainer, x, y) {
        var eList = emailContainer.querySelectorAll('.inputClosed')
        var getCStyle = function (el) {
            if (window.getComputedStyle) {
                cs = getComputedStyle(el, null);
            } else {
                cs = el.currentStyle;
            }
            return cs
        }
        var getPxNum = function (str) {
            return Number(str.split('px')[0])
        }
        for (var i = 0, len = eList.length; i < len; i++) {
            var computedStyle = getCStyle(eList[i])
            var eRect = eList[i].getBoundingClientRect()
            var leftOffset = eRect.left, topOffset = eRect.top, w = getPxNum(computedStyle.width),
                h = getPxNum(computedStyle.height), margin_left = Number(computedStyle.marginLeft.split('px')[0]),
                margin_right = Number(computedStyle.marginRight.split('px')[0]),
                margin_top = Number(computedStyle.marginTop.split('px')[0]),
                margin_bottom = Number(computedStyle.marginBottom.split('px')[0])
            if (y < topOffset - margin_top) {
                setEmptyItem(emailContainer, eList[i], 'before')
                break
            } else if (y <= topOffset + h + margin_bottom) {
                if (x < leftOffset - margin_left) {
                    setEmptyItem(emailContainer, eList[i], 'before')
                    break
                } else if (x <= leftOffset + w + margin_right) {
                    if (x <= leftOffset) {
                        setEmptyItem(emailContainer, eList[i], 'before')
                        break
                    } else if (x >= leftOffset + w) {
                        setEmptyItem(emailContainer, eList[i])
                        break
                    } else {
                    }
                } else {
                    if (eList[i + 1]) {
                        if (eList[i + 1].offsetTop > eList[i].offsetTop) {
                            setEmptyItem(emailContainer, eList[i])
                            break
                        }
                    } else {
                        setEmptyItem(emailContainer, eList[i])
                        break
                    }
                }
            } else if (i === len - 1) {
                setEmptyItem(emailContainer)
                break
            }
        }
        if (eList.length === 0) {
            setEmptyItem(emailContainer)
        }
        cancelSelected()
    }

    function addInputHandler(inputElement) {
        var curItemNode = inputElement.parentNode
        var emailContainer = curItemNode.parentNode
        var itemObj = itemObjList[itemObjList.indexOfId(curItemNode)]
        itemObj.inputListeners.push(EventUtil.addHandler(inputElement, 'textInput', function (event) {
            event = EventUtil.getEvent(event);
            var target = EventUtil.getTarget(event);
            input_resize(inputElement, target.value + event.data)
            if (hasAt(target.value) && isSeparator(event.data)) {
                EventUtil.preventDefault(event)
                closeItem(inputElement)
                addItem(emailContainer, curItemNode)
            }
        }))
        var closeItem = function (input) {
            if (isItemClosing) return
            isItemClosing = true
            var value = input.value
            if (value.trim() === '') {
                curItemNode.classList.add('waitEdit')
                if (input.nextSibling) {
                    itemObj.removeSeparatorListener()
                    curItemNode.removeChild(input.nextSibling)
                }
                isItemClosing = false
                return
            }
            if (!input.nextSibling) {
                addSeparatorSpan(curItemNode, itemObj)
            }
            var valueSpan = document.createElement('span')
            value = value.replace(/[ ]/g, "")
            valueSpan.innerHTML = value
            valueSpan.className = 'valueSpan draggable'
            itemObj.removeInputListener()
            curItemNode.replaceChild(valueSpan, input)
            if (!isEmail(value)) {
                curItemNode.classList.add('error')
                curItemNode.title = '该地址格式有误，请双击修改'
            } else {
                curItemNode.classList.remove('error')
                curItemNode.title = value
            }
            var nodes = emailContainer.childNodes
            nodes.forEach(function (node) {
                if (node.getAttribute('addr') === value) {
                    itemObjList = itemObjList.filter(function (obj) {
                        if (obj.id === node) {
                            obj.removeAllListener()
                            return false
                        }
                        return true
                    })
                    emailContainer.removeChild(node)
                }
            })
            curItemNode.classList.add('inputClosed')
            curItemNode.classList.remove('waitEdit')
            curItemNode.setAttribute("addr", value)
            isItemClosing = false
        }
        itemObj.inputListeners.push(EventUtil.addHandler(inputElement, 'focus', function (event) {
            event = EventUtil.getEvent(event);
            var target = EventUtil.getTarget(event);
            var item = target.parentNode
            if (isDragging) return;
            if (isMouseDown && item.classList.contains('waitEdit')) {
                rangStart = item
                rangEnd = null
                var iRect = inputElement.getBoundingClientRect()
                rangStartPoint = {x: iRect.left + iRect.width / 2, y: iRect.top + iRect.height / 2}
            }
        }))
        itemObj.inputListeners.push(EventUtil.addHandler(inputElement, 'blur', function (event) {
            event = EventUtil.getEvent(event);
            var target = EventUtil.getTarget(event);
            closeItem(inputElement)
        }))
        var lastCursorPos
        itemObj.inputListeners.push(EventUtil.addHandler(inputElement, 'keydown', function (event) {
            event = EventUtil.getEvent(event);
            var target = EventUtil.getTarget(event);
            var identifier = event.keyCode;
            EventUtil.stopPropagation(event)
            var cursorPos = inputElement.selectionStart
            var value = target.value
            switch (identifier) {
                case 37:
                    cancelSelected()
                    if (lastCursorPos === 0 && cursorPos === 0) {
                        curItemNode.previousSibling && setEmptyItem(emailContainer, curItemNode, 'forward')
                    }
                    break
                case 39:
                    cancelSelected()
                    if (lastCursorPos === value.length && cursorPos === value.length) {
                        curItemNode.nextSibling && setEmptyItem(emailContainer, curItemNode, 'backwards')
                    }
                    break
                case 8:
                    input_resize(inputElement)
                    if (lastCursorPos === 0 && cursorPos === 0) {
                        var node = curItemNode.previousSibling
                        if (node) {
                            var classList = node.className.split(' ')
                            if (classList.indexOf('selected') < 0) {
                                node.classList.add('selected')
                                selectedItemList.push(node)
                            } else {
                                itemObjList = itemObjList.filter(function (obj) {
                                    if (obj.id === node) {
                                        obj.removeAllListener()
                                        return false
                                    }
                                    return true
                                })
                                emailContainer.removeChild(node)
                            }
                        }
                    }
                    break
                case 13:
                    if (value.trim() !== '') {
                        closeItem(inputElement)
                        addItem(emailContainer, curItemNode)
                    }
                    break
            }
            lastCursorPos = cursorPos
        }))
    }

    function addItem(emailContainer, referNode) {
        var item = document.createElement("div")
        var itemObj = new ItemObj(item, [], [])
        itemObjList.push(itemObj)
        if (typeof referNode === 'string') {
            item.className = "item inputClosed"
            var span = document.createElement("span")
            span.className = 'valueSpan draggable'
            span.innerHTML = referNode
            item.append(span)
            item.setAttribute("addr", referNode)
            if (!isEmail(referNode)) {
                item.classList.add('error')
                item.title = '该地址格式有误，请双击修改'
            }
            addSeparatorSpan(item, itemObj)
            emailContainer.appendChild(item)
        } else {
            item.className = "item waitEdit"
            var input = document.createElement("input")
            item.append(input)
            emailContainer.insertBefore(item, referNode ? referNode.nextSibling : null)
            addInputHandler(input)
            input.focus()
        }
        itemObj.itemListeners.push(EventUtil.addHandler(item, 'mouseenter', function (event) {
            event = EventUtil.getEvent(event);
            var target = EventUtil.getTarget(event);
            var classList = item.className.split(' ')
            if (classList.indexOf('inputClosed') > -1) {
                if (classList.indexOf('selected') < 0) {
                    item.classList.add('toActivate')
                }
            }
        }))
        itemObj.itemListeners.push(EventUtil.addHandler(item, 'mouseleave', function (event) {
            event = EventUtil.getEvent(event);
            var target = EventUtil.getTarget(event);
            item.classList.remove('toActivate')
        }))
        itemObj.itemListeners.push(EventUtil.addHandler(item, 'click', function (event) {
            event = EventUtil.getEvent(event);
            var target = EventUtil.getTarget(event);
            EventUtil.stopPropagation(event);
        }))
        itemObj.itemListeners.push(EventUtil.addHandler(item, 'mousedown', function (event) {
            event = EventUtil.getEvent(event);
            var target = EventUtil.getTarget(event);
            var classList = item.className.split(' ')
            if (classList.indexOf('inputClosed') > -1) {
                if (classList.indexOf('selected') < 0) {
                    cancelSelected()
                    item.classList.remove('toActivate')
                    item.classList.add('selected')
                    selectedItemList.forEach(function (value, index, array) {
                        if (value !== item)
                            value.classList.remove('selected')
                    })
                    selectedItemList.push(item)
                }
            }
        }))
        itemObj.itemListeners.push(EventUtil.addHandler(item, 'dblclick', function (event) {
            event = EventUtil.getEvent(event);
            var target = EventUtil.getTarget(event);
            EventUtil.stopPropagation(event);
            var classList = item.className.split(' ')
            if (classList.indexOf('inputClosed') > -1) {
                item.classList.remove('inputClosed')
                selectedItemList.forEach(function (item, index, array) {
                    item.classList.remove('selected')
                })
                selectedItemList = []
                var valueSpan = item.querySelector('.valueSpan')
                var input = document.createElement('input')
                input.value = valueSpan.innerHTML
                item.replaceChild(input, valueSpan)
                input_resize(input)
                addInputHandler(input)
                input.focus()
                item.removeAttribute("addr")
                itemObj.removeSeparatorListener()
                item.removeChild(input.nextSibling)
            }
        }))
    }

    function getEmptyItem(emailContainer) {
        return emailContainer.getElementsByClassName('waitEdit')[0]
    }

    function removeEmptyItem(emailContainer) {
        var emptyItem = getEmptyItem(emailContainer)
        emptyItem && emailContainer.removeChild(emptyItem)
    }

    function setEmptyItem(emailContainer, referNode, towards) {
        if (referNode && referNode.querySelector("input") && referNode.querySelector("input").value.trim() !== '') {
            referNode.classList.remove('waitEdit')
        }
        var emptyItem = getEmptyItem(emailContainer)
        if (!emptyItem) {
            addItem(emailContainer)
            emptyItem = getEmptyItem(emailContainer)
        }
        if (towards === 'forward') {
            emailContainer.insertBefore(emptyItem, referNode ? referNode.previousSibling || referNode : null)
        } else if (towards === 'backwards') {
            emailContainer.insertBefore(emptyItem, referNode ? (referNode.nextSibling && referNode.nextSibling.nextSibling) : null)
        } else if (towards === 'before') {
            emailContainer.insertBefore(emptyItem, referNode ? referNode : null)
        } else {
            emailContainer.insertBefore(emptyItem, referNode ? referNode.nextSibling : null)
        }
        setTimeout(function () {
            emptyItem.querySelector("input").focus()
        })
    }

    function cancelSelected() {
        if (isDragging) return
        selectedItemList.forEach(function (item, index, array) {
            item.classList.remove('selected')
        })
        selectedItemList = []
    }

    function deleteAllSelections() {
        var firstItem = selectedItemList[0]
        var emailContainer = firstItem.parentNode
        setEmptyItem(emailContainer, firstItem)
        selectedItemList.forEach(function (item, index, array) {
            itemObjList = itemObjList.filter(function (obj) {
                if (obj.id === item) {
                    obj.removeAllListener()
                    return false
                }
                return true
            })
            emailContainer.removeChild(item)
        })
        selectedItemList = []
    }

    function sudoku(rangStart, rangEndPoint) {
        var x = rangEndPoint.x, y = rangEndPoint.y
        var rect = rangStart.getBoundingClientRect(), orien
        var top = rect.top, bottom = rect.bottom, left = rect.left, right = rect.right
        if (y < top) {
            orien = 'top'
        } else if (y > bottom) {
            orien = 'bottom'
        } else if (x < left) {
            orien = 'left'
        } else if (x > right) {
            orien = 'right'
        } else {
            orien = 'middle'
        }
        return orien
    }

    function getRangEndByCoord(emailContainer, x, y) {
        var getCStyle = function (el) {
            if (window.getComputedStyle) {
                cs = getComputedStyle(el, null);
            } else {
                cs = el.currentStyle;
            }
            return cs
        }
        var eList = emailContainer.querySelectorAll('.inputClosed')
        var cRect = emailContainer.getBoundingClientRect()
        var cStyle = getCStyle(emailContainer)
        var cTop = cRect.top + Number(cStyle.borderTop.split('px')[0]) + Number(cStyle.paddingTop.split('px')[0])
        var cBottom = cRect.bottom - Number(cStyle.borderBottom.split('px')[0]) - Number(cStyle.paddingBottom.split('px')[0])
        var cLeft = cRect.left + Number(cStyle.borderLeft.split('px')[0]) + Number(cStyle.paddingLeft.split('px')[0])
        var cRight = cRect.right - Number(cStyle.borderRight.split('px')[0]) - Number(cStyle.paddingRight.split('px')[0])
        x = x > cRight ? cRight : x < cLeft ? cLeft : x
        y = y < cTop ? cTop : y > cBottom ? cBottom : y
        var standbys = []
        for (var i = 0, len = eList.length; i < len; i++) {
            var computedStyle = getCStyle(eList[i])
            var eRect = eList[i].getBoundingClientRect()
            var margin_top = Number(computedStyle.marginTop.split('px')[0]),
                margin_bottom = Number(computedStyle.marginBottom.split('px')[0]), top = eRect.top - margin_top,
                bottom = eRect.bottom + margin_bottom, left = eRect.left, right = eRect.right
            if (y <= top) {
                if (x <= left) {
                    standbys = i === 0 ? [null, eList[i]] : [eList[i - 1], eList[i]]
                    break
                } else {
                    if (x <= right) {
                        standbys = [eList[i]]
                        break
                    } else {
                        if (eList[i + 1]) {
                            if (eList[i + 1].offsetTop > eList[i].offsetTop) {
                                standbys = [eList[i], eList[i + 1]]
                                break
                            }
                        } else {
                            standbys = [eList[i], null]
                            break
                        }
                    }
                }
            } else {
                if (y <= bottom) {
                    if (x <= left) {
                        standbys = i === 0 ? [null, eList[i]] : [eList[i - 1], eList[i]]
                        break
                    } else {
                        if (x <= right) {
                            standbys = [eList[i]]
                            break
                        } else {
                            if (eList[i + 1]) {
                                if (eList[i + 1].offsetTop > eList[i].offsetTop) {
                                    standbys = [eList[i], eList[i + 1]]
                                    break
                                }
                            } else {
                                standbys = [eList[i], null]
                                break
                            }
                        }
                    }
                } else {
                    if (i + 1 === len) {
                        standbys = [eList[i], null]
                        break
                    }
                }
            }
        }
        var orien = sudoku(rangStart, rangEndPoint)
        if (standbys.length === 1) {
            rangEnd = standbys[0]
        } else {
            if (orien === 'top' || orien === 'left') {
                rangEnd = standbys[1]
            } else if (orien === 'right' || orien === 'bottom') {
                rangEnd = standbys[0]
            }
        }
        return {orien: orien, rangEnd: rangEnd}
    }

    function containerEventHandler() {
        var emailContainer = this.emailContainer
        EventUtil.addHandler(emailContainer, 'mousedown', eConMousedownEvent.bind(this))
        EventUtil.addHandler(this.emailContainer, 'contextmenu', eConContextmenuEvent)
    }

    function eConMousedownEvent(event) {
        event = EventUtil.getEvent(event);
        var target = EventUtil.getTarget(event);
        if (isDragging) return;
        if (target.classList.contains('_emailContainer')) {
            addByCoord(this.emailContainer, event.clientX, event.clientY)
        }
        isMouseDown = true
        var item = target.parentNode
        if (item.classList.contains('waitEdit')) {
            rangStart = item
            rangEnd = null
        }
        rangStartPoint = {x: event.clientX, y: event.clientY}
    }

    function eConContextmenuEvent(event) {
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event)
    }

    function removeConListener(emailContainer) {
        EventUtil.removeHandler(emailContainer, 'mousedown', eConMousedownEvent)
        EventUtil.removeHandler(emailContainer, 'contextmenu', eConContextmenuEvent)
    }

    function drawRang(params) {
        if (!rangStart) return;
        if (isDragging) return;
        var event = params.event, target = params.target
        var itemEl = isConChildEl(target) && bubbleSearchByClassName(target, 'item')
        var emailContainer = rangStart.parentNode, lastRangEnd = rangEnd
        if (itemEl && itemEl.parentNode === emailContainer) {
            rangEnd = itemEl
            rangEndPoint = {x: event.clientX, y: event.clientY}
            highLightRang()
        } else {
            rangEndPoint = {x: event.clientX, y: event.clientY}
            var res = getRangEndByCoord(emailContainer, event.clientX, event.clientY)
            rangEnd = res.rangEnd
            highLightRang(res.orien)
        }
    }

    var scrollTimer = null, topStep = 0, leftStep = 0, step1 = 10, step2 = 40
    var documentEl = document.documentElement || document.body

    function scroll(event, callback) {
        var docClientWidth = documentEl.clientWidth, docClientHeight = documentEl.clientHeight
        if (event.clientY < 10 || event.clientY > docClientHeight - 10 || event.clientX < 10 || event.clientX > docClientWidth - 10) {
            if (scrollTimer) return;
            if (event.clientY < 10) {
                topStep = event.clientY < 3 ? step2 : step1
            } else if (event.clientY > docClientHeight - 10) {
                topStep = event.clientY > docClientHeight - 7 ? -step2 : -step1
            } else {
                topStep = 0
            }
            if (event.clientX < 10) {
                leftStep = event.clientX < 3 ? step2 : step1
            } else if (event.clientX > docClientWidth - 10) {
                leftStep = event.clientX > docClientWidth - 7 ? -step2 : -step1
            } else {
                leftStep = 0
            }
            scrollTimer = setInterval(function () {
                var docScrollTop = documentEl.scrollTop, docScrollLeft = documentEl.scrollLeft
                if (docScrollTop >= 0 && docScrollTop + docClientHeight < documentEl.offsetHeight) {
                    documentEl.scrollTop = docScrollTop - topStep
                }
                if (docScrollLeft >= 0 && docScrollLeft + docClientHeight < documentEl.offsetWidth) {
                    documentEl.scrollLeft = docScrollLeft - leftStep
                }
                if (callback) {
                    callback()
                }
            }, 100)
        } else {
            cancelScroll()
        }
    }

    function cancelScroll() {
        if (!scrollTimer) return
        clearInterval(scrollTimer)
        scrollTimer = null
    }

    documentEventHandler()

    function documentEventHandler() {
        EventUtil.addHandler(document, 'mousemove', function (event) {
            event = EventUtil.getEvent(event);
            var target = EventUtil.getTarget(event);
            if (!rangStart) return;
            if (isDragging) return;
            scroll(event, function () {
                throttle(drawRang, {event: event, target: target})
            })
            throttle(drawRang, {event: event, target: target})
        })
        EventUtil.addHandler(document, 'mouseup', function (event) {
            event = EventUtil.getEvent(event);
            var target = EventUtil.getTarget(event);
            cancelScroll()
            isMouseDown = false
            rangStart = null
            if (!isDragging) {
                selectedItemList.length && cancelCursorFocus()
            }
        })
        EventUtil.addHandler(document, 'mousedown', function (event) {
            event = EventUtil.getEvent(event);
            var target = EventUtil.getTarget(event);
            if (target.classList && target.classList.contains('selected') && isConChildEl(target)) {
                return
            }
            if (target.parentNode && target.parentNode.classList && target.parentNode.classList.contains('selected') && isConChildEl(target.parentNode)) {
                return
            }
            cancelSelected()
        })
    }

    function highLightRang(orien) {
        cancelSelected()
        if (!rangStart || !rangEnd) {
            return
        }
        var startItem = rangStart, endItem = rangEnd
        var emailContainer = rangStart.parentNode
        var items = emailContainer.querySelectorAll('.item')
        if (orien) {
            if (orien === 'top' || orien === 'left') {
                if (!rangStart.previousSibling) return;
                startItem = rangEnd, endItem = rangStart
                var start = Array.prototype.indexOf.call(items, startItem)
                var end = Array.prototype.indexOf.call(items, endItem)
                if (start > end) {
                    return;
                }
            } else if (orien === 'right' || orien === 'bottom') {
                if (!rangStart.nextSibling) return;
                var start = Array.prototype.indexOf.call(items, startItem)
                var end = Array.prototype.indexOf.call(items, endItem)
                if (start > end) {
                    return;
                }
            } else {
                return;
            }
        } else {
            var start = Array.prototype.indexOf.call(items, rangStart)
            var end = Array.prototype.indexOf.call(items, rangEnd)
            if (start > end) {
                startItem = rangEnd, endItem = rangStart
            }
        }
        var mark = function (el) {
            if (el && el.classList.contains('inputClosed')) {
                el.classList.add('selected')
                selectedItemList.push(el)
            }
        }
        mark(startItem)
        while (startItem && startItem !== endItem) {
            startItem = startItem.nextSibling
            mark(startItem)
        }
    }

    EventUtil.addHandler(document, 'keydown', function (event) {
        event = EventUtil.getEvent(event);
        var target = EventUtil.getTarget(event);
        var identifier = event.keyCode;
        if (selectedItemList.length < 1) return
        var emailContainer = selectedItemList[0].parentNode
        switch (identifier) {
            case 37:
                setEmptyItem(emailContainer, selectedItemList[0], 'before')
                cancelSelected()
                break
            case 39:
                setEmptyItem(emailContainer, selectedItemList[0])
                cancelSelected()
                break
            case 8:
                deleteAllSelections()
                break
            case 46:
                deleteAllSelections()
                break
        }
    })
    DragDrop.enable()
    var referEl, isDragging = false

    function throttle(method, params) {
        clearTimeout(method.tId)
        method.tId = setTimeout(function () {
            method(params)
        }, 10)
    }

    function cancelCursorFocus() {
        if (document.hasFocus()) {
            var input = document.activeElement
            if (input) input.blur()
        }
    }

    function getCursorItem() {
        var cursorI = null
        if (document.hasFocus()) {
            cursorI = bubbleSearchByClassName(document.activeElement, 'waitEdit')
        }
        return isConChildEl(cursorI) && cursorI
    }

    function isConChildEl(el) {
        el = bubbleSearchByClassName(el, '_emailContainer')
        if (el) {
            var result = containers.some(function (item) {
                return item === el
            })
            return result
        } else {
            return false
        }
    }

    function bubbleSearchByClassName(el, className) {
        while (el && !el.classList || (el && el.classList && !el.classList.contains(className))) {
            el = el.parentNode
        }
        return el
    }

    function removeDuplicates(emailContainer, refers) {
        var nodes = emailContainer.childNodes
        for (var i = 0, len = refers.length; i < len; i++) {
            nodes.forEach(function (node) {
                if (node.getAttribute('addr') === refers[i].getAttribute('addr')) {
                    itemObjList = itemObjList.filter(function (obj) {
                        if (obj.id === node) {
                            obj.removeAllListener()
                            return false
                        }
                        return true
                    })
                    emailContainer.removeChild(node)
                }
            })
        }
    }

    DragDrop.addHandler('dragstart', function (event) {
        var emailContainer = event.target.parentNode
        removeEmptyItem(emailContainer)
        isDragging = true
    })

    function doDrag(params) {
        var event = params.event
        var referEl = event.referEl
        var curEmailContainer
        if (referEl.className.indexOf("_emailContainer") > -1 && isConChildEl(referEl)) {
            curEmailContainer = referEl
            addByCoord(curEmailContainer, event.clientX, event.clientY)
        } else if ((referEl.className.indexOf("draggable") > -1 || referEl.className.indexOf("semicolon") > -1) && isConChildEl(referEl)) {
            referEl = referEl.parentNode
            curEmailContainer = referEl.parentNode
            var elW = referEl.clientWidth
            var elX = referEl.offsetLeft
            var x = event.clientX
            if (x <= elX + elW / 2) {
                setEmptyItem(curEmailContainer, referEl, 'before')
            } else {
                setEmptyItem(curEmailContainer, referEl)
            }
        } else if (isConChildEl(bubbleSearchByClassName(referEl, 'waitEdit'))) {
        } else {
            cancelCursorFocus()
        }
    }

    DragDrop.addHandler('drag', function (event) {
        scroll(event, function () {
            throttle(doDrag, {event: event})
        })
        throttle(doDrag, {event: event})
    })
    DragDrop.addHandler('dragend', function (event) {
        referEl = event.referEl
        var curEmailContainer
        var moveHandle = function () {
            var cursorI = getCursorItem()
            if (!cursorI || cursorI.parentNode !== curEmailContainer) {
                console.warn('cursor disappeared.')
                return
            }
            var fragment = document.createDocumentFragment()
            for (var i = 0, len = selectedItemList.length; i < len; i++) {
                fragment.appendChild(selectedItemList[i])
            }
            removeDuplicates(curEmailContainer, fragment.childNodes)
            curEmailContainer.insertBefore(fragment, cursorI)
            cancelCursorFocus()
        }
        if (referEl.className.indexOf("_emailContainer") > -1 && isConChildEl(referEl)) {
            curEmailContainer = referEl
            moveHandle()
        } else if ((referEl.className.indexOf("draggable") > -1 || referEl.className.indexOf("semicolon") > -1) && isConChildEl(referEl)) {
            referEl = referEl.parentNode
            curEmailContainer = referEl.parentNode
            if (referEl.classList.contains('selected')) {
                cancelCursorFocus()
            } else {
                moveHandle()
            }
        } else if (isConChildEl(bubbleSearchByClassName(referEl, 'waitEdit'))) {
            curEmailContainer = bubbleSearchByClassName(referEl, '_emailContainer')
            moveHandle()
        } else {
            cancelCursorFocus()
        }
        isDragging = false
    })

    function init() {
        this.emailIMEBox.className = 'emailIME-box'
        this.eLabel.className = 'eLabel'
        this.eLabel.innerHTML = this.label + '：' || ''
        this.emailContainer.className = '_emailContainer'
        this.emailIMEBox.appendChild(this.eLabel)
        this.emailIMEBox.appendChild(this.emailContainer)
        this.parentNode.appendChild(this.emailIMEBox)
        document.body.appendChild(calculatorSpan)
        containerEventHandler.call(this)
        this.addAddrs(this.emailAddrList)
    }

    var containers = []
    var selectedItemList = []
    var itemObjList = new ItemObjArray()
    var isItemClosing = false
    var calculatorSpan = document.createElement('div')
    calculatorSpan.className = 'width_calculator'
    var isMouseDown, rangStart, rangStartPoint, rangEnd, rangEndPoint

    function emailIME(parentNode, label, emailAddrList) {
        if (this instanceof emailIME) {
            this.parentNode = parentNode || document.body
            this.label = label
            this.emailAddrList = emailAddrList
            this.emailIMEBox = document.createElement('div')
            this.eLabel = document.createElement('label')
            this.emailContainer = document.createElement('div')
            containers.push(this.emailContainer)
            init.call(this)
        } else {
            return new emailIME(parentNode, label, emailAddrList)
        }
    }

    emailIME.prototype = {
        constructor: emailIME, addAddrs: function (addrList) {
            if (!addrList) {
                setEmptyItem(this.emailContainer)
                return
            }
            if (Object.prototype.toString.call(addrList) !== "[object Array]") {
                addrList = [addrList]
            }
            addrList = addrList.filter(function (e) {
                if (e === "" || e === undefined) {
                    return false
                }
                return true
            })
            addrList = addrList.map(function (e) {
                return e.toString()
            })
            var list = []
            list.push(addrList[0])
            for (var i = 1, len = addrList.length; i < len; i++) {
                var isRepeat = false
                for (var j = 0; j < list.length; j++) {
                    if (addrList[i] === list[j]) {
                        isRepeat = true
                        break
                    }
                }
                if (!isRepeat) {
                    list.push(addrList[i])
                }
            }
            var that = this
            list.forEach(function (value) {
                addItem(that.emailContainer, value)
            })
            removeEmptyItem(this.emailContainer)
        }, getAddrs: function () {
            var addrs = []
            var itemList = this.emailContainer.getElementsByClassName('item inputClosed')
            Array.prototype.forEach.call(itemList, function (item) {
                addrs.push(item.getAttribute('addr'))
            })
            return addrs
        }, destroy: function () {
            cancelScroll()
            var items = this.emailContainer.getElementsByClassName('item')
            Array.prototype.forEach.call(items, function (item) {
                itemObjList = itemObjList.filter(function (obj) {
                    if (obj.id === item) {
                        obj.removeAllListener()
                        return false
                    }
                    return true
                })
            })
            removeConListener(this.emailContainer)
            containers = containers.filter(function (item) {
                if (item === this.emailContainer) {
                    return false
                }
                return true
            })
            this.parentNode.removeChild(this.emailIMEBox)
        }
    }
    if (!window.emailIME) {
        window.emailIME = emailIME
    }
    return emailIME
})
