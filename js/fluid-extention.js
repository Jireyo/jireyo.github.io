// 鼠标移动星星特效
// (function() { function t() { i(), a() }  function i() { document.addEventListener("mousemove", o), document.addEventListener("touchmove", e), document.addEventListener( "touchstart", e), window.addEventListener("resize", n) }  function n(t) { d = window.innerWidth, window.innerHeight }  function e(t) { if (t.touches.length > 0) for (var i = 0; i < t.touches.length; i++) s(t.touches[i].clientX, t.touches[i].clientY, r[Math.floor(Math.random() * r.length)]) }  function o(t) { u.x = t.clientX, u.y = t.clientY, s(u.x, u.y, r[Math.floor(Math.random() * r.length)]) }  function s(t, i, n) { var e = new l; e.init(t, i, n), f.push(e) }  function h() { for (var t = 0; t < f.length; t++) f[t].update(); for (t = f.length - 1; t >= 0; t--) f[t].lifeSpan < 0 && (f[t].die(), f.splice(t, 1)) }  function a() { requestAnimationFrame(a), h() }  function l() { this.character = "*", this.lifeSpan = 120, this.initialStyles = { position: "fixed", top: "0", display: "block", pointerEvents: "none", "z-index": "10000000", fontSize: "20px", "will-change": "transform" }, this.init = function(t, i, n) { this.velocity = { x: (Math.random() < .5 ? -1 : 1) * (Math.random() / 2), y: 1 }, this.position = { x: t - 10, y: i - 20 }, this.initialStyles.color = n, this.element = document.createElement("span"), this.element.innerHTML = this.character, c(this.element, this.initialStyles), this.update(), document.body.appendChild(this.element) }, this.update = function() { this.position.x += this.velocity.x, this.position.y += this.velocity.y, this.lifeSpan--, this.element.style.transform = "translate3d(" + this.position.x + "px," + this.position.y + "px,0) scale(" + this.lifeSpan / 120 + ")" }, this.die = function() { this.element.parentNode.removeChild(this.element) } }  function c(t, i) { for (var n in i) t.style[n] = i[n] } var r = ["#D61C59", "#E7D84B", "#1B8798", "#ffaaff", "#aaaaff"], d = window.innerWidth, u = (window.innerHeight, { x: d / 2, y: d / 2 }), f = []; t() })();
// 鼠标点击爱心
!function(e,t,a){function n(){c(".heart{width: 10px;height: 10px;position: fixed;background: #f00;transform: rotate(45deg);-webkit-transform: rotate(45deg);-moz-transform: rotate(45deg);}.heart:after,.heart:before{content: '';width: inherit;height: inherit;background: inherit;border-radius: 50%;-webkit-border-radius: 500%;-moz-border-radius: 50%;position: fixed;}.heart:after{top: -5px;}.heart:before{left: -5px;}"),o(),r()}function r(){for(var e=0;e<d.length;e++)d[e].alpha<=0?(t.body.removeChild(d[e].el),d.splice(e,1)):(d[e].y--,d[e].scale+=.004,d[e].alpha-=.013,d[e].el.style.cssText="left:"+d[e].x+"px;top:"+d[e].y+"px;opacity:"+d[e].alpha+";transform:scale("+d[e].scale+","+d[e].scale+") rotate(45deg);background:"+d[e].color+";z-index:99999");requestAnimationFrame(r)}function o(){var t="function"==typeof e.onclick&&e.onclick;e.onclick=function(e){t&&t(),i(e)}}function i(e){var a=t.createElement("div");a.className="heart",d.push({el:a,x:e.clientX-5,y:e.clientY-5,scale:1,alpha:1,color:s()}),t.body.appendChild(a)}function c(e){var a=t.createElement("style");a.type="text/css";try{a.appendChild(t.createTextNode(e))}catch(t){a.styleSheet.cssText=e}t.getElementsByTagName("head")[0].appendChild(a)}function s(){return"rgb("+~~(255*Math.random())+","+~~(255*Math.random())+","+~~(255*Math.random())+")"}var d=[];e.requestAnimationFrame=function(){return e.requestAnimationFrame||e.webkitRequestAnimationFrame||e.mozRequestAnimationFrame||e.oRequestAnimationFrame||e.msRequestAnimationFrame||function(e){setTimeout(e,1e3/60)}}(),n()}(window,document);

// 鼠标点击烟花
// class Circle {
//   constructor({ origin, speed, color, angle, context }) {
//     this.origin = origin
//     this.position = { ...this.origin }
//     this.color = color
//     this.speed = speed
//     this.angle = angle
//     this.context = context
//     this.renderCount = 0
//   }

//   draw() {
//     this.context.fillStyle = this.color
//     this.context.beginPath()
//     this.context.arc(this.position.x, this.position.y, 2, 0, Math.PI * 2)
//     this.context.fill()
//   }

//   move() {
//     this.position.x = (Math.sin(this.angle) * this.speed) + this.position.x
//     this.position.y = (Math.cos(this.angle) * this.speed) + this.position.y + (this.renderCount * 0.3)
//     this.renderCount++
//   }
// }

// class Boom {
//   constructor ({ origin, context, circleCount = 16, area }) {
//     this.origin = origin
//     this.context = context
//     this.circleCount = circleCount
//     this.area = area
//     this.stop = false
//     this.circles = []
//   }

//   randomArray(range) {
//     const length = range.length
//     const randomIndex = Math.floor(length * Math.random())
//     return range[randomIndex]
//   }

//   randomColor() {
//     const range = ['8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
//     return '#' + this.randomArray(range) + this.randomArray(range) + this.randomArray(range) + this.randomArray(range) + this.randomArray(range) + this.randomArray(range)
//   }

//   randomRange(start, end) {
//     return (end - start) * Math.random() + start
//   }

//   init() {
//     for(let i = 0; i < this.circleCount; i++) {
//       const circle = new Circle({
//         context: this.context,
//         origin: this.origin,
//         color: this.randomColor(),
//         angle: this.randomRange(Math.PI - 1, Math.PI + 1),
//         speed: this.randomRange(1, 6)
//       })
//       this.circles.push(circle)
//     }
//   }

//   move() {
//     this.circles.forEach((circle, index) => {
//       if (circle.position.x > this.area.width || circle.position.y > this.area.height) {
//         return this.circles.splice(index, 1)
//       }
//       circle.move()
//     })
//     if (this.circles.length == 0) {
//       this.stop = true
//     }
//   }

//   draw() {
//     this.circles.forEach(circle => circle.draw())
//   }
// }

// class CursorSpecialEffects {
//   constructor() {
//     this.computerCanvas = document.createElement('canvas')
//     this.renderCanvas = document.createElement('canvas')

//     this.computerContext = this.computerCanvas.getContext('2d')
//     this.renderContext = this.renderCanvas.getContext('2d')

//     this.globalWidth = window.innerWidth
//     this.globalHeight = window.innerHeight

//     this.booms = []
//     this.running = false
//   }

//   handleMouseDown(e) {
//     const boom = new Boom({
//       origin: { x: e.clientX, y: e.clientY },
//       context: this.computerContext,
//       area: {
//         width: this.globalWidth,
//         height: this.globalHeight
//       }
//     })
//     boom.init()
//     this.booms.push(boom)
//     this.running || this.run()
//   }

//   handlePageHide() {
//     this.booms = []
//     this.running = false
//   }

//   init() {
//     const style = this.renderCanvas.style
//     style.position = 'fixed'
//     style.top = style.left = 0
//     style.zIndex = '999999999999999999999999999999999999999999'
//     style.pointerEvents = 'none'

//     style.width = this.renderCanvas.width = this.computerCanvas.width = this.globalWidth
//     style.height = this.renderCanvas.height = this.computerCanvas.height = this.globalHeight

//     document.body.append(this.renderCanvas)

//     window.addEventListener('mousedown', this.handleMouseDown.bind(this))
//     window.addEventListener('pagehide', this.handlePageHide.bind(this))
//   }

//   run() {
//     this.running = true
//     if (this.booms.length == 0) {
//       return this.running = false
//     }

//     requestAnimationFrame(this.run.bind(this))

//     this.computerContext.clearRect(0, 0, this.globalWidth, this.globalHeight)
//     this.renderContext.clearRect(0, 0, this.globalWidth, this.globalHeight)

//     this.booms.forEach((boom, index) => {
//       if (boom.stop) {
//         return this.booms.splice(index, 1)
//       }
//       boom.move()
//       boom.draw()
//     })
//     this.renderContext.drawImage(this.computerCanvas, 0, 0, this.globalWidth, this.globalHeight)
//   }
// }

// const cursorSpecialEffects = new CursorSpecialEffects()
// cursorSpecialEffects.init()

//雪花
// (function($){
//   $.fn.snow = function(options){
//   var $flake = $('<div id="snowbox" />').css({'position': 'absolute','z-index':'9999', 'top': '-50px'}).html('&#10052;'),
//   documentHeight  = $(document).height(),
//   documentWidth   = $(document).width(),
//   defaults = {
//       minSize     : 10,
//       maxSize     : 20,
//       newOn       : 1000,
//       flakeColor  : "#AFDAEF" /* 此处可以定义雪花颜色，若要白色可以改为#FFFFFF */
//   },
//   options = $.extend({}, defaults, options);
//   var interval= setInterval( function(){
//   var startPositionLeft = Math.random() * documentWidth - 100,
//   startOpacity = 0.5 + Math.random(),
//   sizeFlake = options.minSize + Math.random() * options.maxSize,
//   endPositionTop = documentHeight - 200,
//   endPositionLeft = startPositionLeft - 500 + Math.random() * 500,
//   durationFall = documentHeight * 10 + Math.random() * 5000;
//   $flake.clone().appendTo('body').css({
//       left: startPositionLeft,
//       opacity: startOpacity,
//       'font-size': sizeFlake,
//       color: options.flakeColor
//   }).animate({
//       top: endPositionTop,
//       left: endPositionLeft,
//       opacity: 0.2
//   },durationFall,'linear',function(){
//       $(this).remove()
//   });
//   }, options.newOn);
//   };
// })(jQuery);
// $(function(){
//   $.fn.snow({ 
//       minSize: 5, /* 定义雪花最小尺寸 */
//       maxSize: 50,/* 定义雪花最大尺寸 */
//       newOn: 300  /* 定义密集程度，数字越小越密集 */
//   });
// });