function renderSketch(page, num, total, numChapters, currChapter){
	// get all the terms (from the TOC) and wrap them in a <mark></mark> tag
	let isRight = page.element.classList.contains("pagedjs_right_page"); // for positioning below
	const ps = page.element.querySelectorAll('.pagedjs_pages p'); // paragraphs
	let str = strings.join("|"); // orrrrr
	for( let i = 0; i < ps.length; i++ ) {
		let p = ps[i];
		let re = new RegExp(`(${str})([\s\.<])`, "gim"); // match "artistic research", but not "artistic researchers"
		let text = p.innerHTML;
		text = text.replace(re, (match, p1, p2) => { return "<mark>"+p1+"</mark>"+p2});
		p.innerHTML = text;
	}
	// To convert term text to unique color
	String.prototype.hashCode = function() {
		var hash = 0, i, chr;
		if (this.length === 0) return hash;
		for (i = 0; i < this.length; i++) {
			chr   = this.charCodeAt(i);
			hash  = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
	};

	const s = (sketch) => {
		let canvas, el;
		let dimensions = {};
		
		sketch.setup = () => {
			el = page.element;
			canvas = sketch.createCanvas(el.offsetWidth, el.offsetHeight, sketch.SVG);
			canvas.parent(el);
			canvas.position(0, 0);
			canvas.style("z-index", 0);
			sketch.ellipseMode(sketch.CENTER);
			dimensions.bleed = sketch.getDimensions('bleed');
			dimensions.margin = sketch.getDimensions('margin');
			if(!page.element.querySelector("h1")){

			}
			let left = dimensions.bleed.left + 20 ;// + dimensions.margin.left;
			if (isRight) {
				left = sketch.width - dimensions.bleed.right - 20; // - dimensions.margin.right;
			} 
			let marks = el.querySelectorAll("mark");
			sketch.noStroke();
			
			for( let i = 0; i < marks.length; i++ ) {
				let mark = marks[i];
				let text = mark.innerText;
				let hash = text.hashCode();
				let r = (hash & 0xFF0000) >> 16;
				let g = (hash & 0x00FF00) >> 8;
				let b = hash & 0x0000FF;
				sketch.fill(r,g,b);
				mark.style.textDecoration = "underline";
				mark.style.textDecorationColor = 'rgba(' + r  + "," +  g + "," +  b + ')';
				mark.style.textDecorationStyle = "wavy";
				mark.style.backgroundColor = "transparent";//'rgba(' + r  + "," +  g + "," +  b + ')';
				let top = mark.offsetTop;
				sketch.ellipse( left, dimensions.bleed.top + dimensions.margin.top + top + 8 , 10 ); // magic 8 = baseline = 12pt = 16px / 2
			}
		};

		sketch.getDimensions = (area) => {
			let dir = ['top', 'bottom', 'right', 'left'];
			let ret = {};
			for( let i = 0; i < 4; i++) {
				let b = el.querySelector('.pagedjs_' + area + '-' + dir[i]);
				ret[dir[i]] = (i < 2 ) ? b.clientHeight : b.clientWidth;
			}
			return ret;
		}
		// sketch.draw = () => {};
	};

	let myp5 = new p5(s); 
}