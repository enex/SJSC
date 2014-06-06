//TODO: die repaint funktion optimiern sodas wirklich nur die Änderung neu gezeichnet wird
//TODO: layering unterstützen um die Geschwindigkeit zu optimieren
function canvas(canvas){
	var ctx = canvas.getContext("2d");
	canvas.ctx = ctx;
	canvas.model = [];//model of the things being displayed
	canvas.events = [];

	//Hilf canvas um hover und andere Events zu detektieren
	var h = document.createElement("canvas");
	document.body.appendChild(h);
	h.ctx = h.getContext("2d");
	h.width = canvas.width;
	h.height = canvas.height;
	h.style.display= "none";

	function draw(m, opt){
		if(m instanceof Array)for(var i in m){//Alle elemente durchgehen
			draw(m[i]);
		}else if(m instanceof Object){
			if(m.hire){
				if(m.hire instanceof Object){
					draw(m.hire, m);
				}else if(m.hire instanceof Array){
					for(var j in m.hire){
						draw(m.hire[j], opt);
					}
				}
			}
			if(!opt)opt = m;
			//die im übergeordneten Element nicht gesetzten Parameter von untergeordneten übernehmen
			for(var i in m)if(!opt[i])opt[i] = m[i];
			
			if(m.draw){
				ctx.beginPath();
				ctx.fillStyle = opt.color;//fill style
				m.draw(ctx, opt);
				ctx.stroke();
			}

			//event handling für die vier vorhandenen events
			if(m.onmouseover || m.onmousedown || m.onmouseup || m.onmouseout || m.draggable){
				canvas.events.push(m);
				m.evtid = canvas.events.length;
			}

			if(opt.evtid)if(m.draw){
				h.ctx.beginPath();
				h.ctx.fillStyle = canvas.generateColor(opt.evtid);
				//h.ctx.strokeStyle = cnavas.generateColor(opt.evtid);
				m.draw(h.ctx, opt);
				ctx.stroke();
			}
			Object.observe(m, change);
		}
	};
	function change(e){
		canvas.redraw();
	}
	Object.observe(canvas.model, change);//änderungen am model überwachen
	//Hilfsfunktionen
	canvas.redraw = function(){
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		canvas.events = [];
		h.width = canvas.width;
		h.height = canvas.height;
		h.ctx.clearRect(0, 0, canvas.width, canvas.height);
		draw(canvas.model, canvas.model);
	};
	canvas.generateColor = function(i){
		var str = i.toString(16);
		while (str.length < 6) str = '0' + str;
		return "#"+str;
	};
	canvas.expand = function(){
		canvas.height = canvas.parentNode.offsetHeight;
		canvas.width = canvas.parentNode.offsetWidth;
		canvas.redraw();
		canvas.parentNode.onresize = canvas.expand;
	}
	//event listening
	canvas.onmousemove = function(e){
		for(var i in canvas.events){
			var n = canvas.events[i];
			if(n.hover){//onmouseout setzen
				canvas.events[i].hover = false;
				if(n.onmouseout)n.onmouseout();//on mouse out event feuern
			}
			if(n.drag){
				n.x = Math.round(n.x + (e.offsetX - n.dragx));
				n.y = Math.round(n.y + (e.offsetY - n.dragy));
				n.dragx = e.offsetX;
				n.dragy = e.offsetY;
				canvas.redraw();
			}
		}
		var k = h.ctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
		if(k[2]==0)return;
		var d = canvas.events[k[2]-1];
		if(d)if(!d.hover)if(d.onmouseover)d.onmouseover();
		if(d)d.hover = true;
	};
	canvas.onmousedown = function(e){
		var i = h.ctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
		if(i[2] == 0)return;
		var d = canvas.events[i[2]-1];
		if(d.onmousedown)d.onmousedown();
		if(d.draggable){
			d.drag = true;
			d.dragx = e.offsetX;
			d.dragy = e.offsetY;
		}
	};
	canvas.onmouseup = function(e){
		for(var i in canvas.events)if(canvas.events[i].drag){
			delete canvas.events[i].drag;//drag end
			delete canvas.events[i].dragx;
			delete canvas.events[i].dragy;
		}
		var i = h.ctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
		if(i[2] == 0)return;
		var d = canvas.events[i[2]-1];
		if(d.onmouseup)d.onmouseup();
	};
	return canvas;
}