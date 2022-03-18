function renderSketch(page, num, total, numChapters, currChapter){
	let isRight = page.element.classList.contains("pagedjs_right_page");
	console.log(page, num, total, numChapters, currChapter)

	const s = (sketch) => {
		let canvas, el;
		let dimensions = {};
		sketch.setup = () => {
			el = page.element;
			dimensions = sketch.getDimensions();
			
			canvas = sketch.createCanvas(el.offsetWidth, el.offsetHeight, sketch.SVG);
			canvas.parent(el);
			canvas.position(0, 0);
			canvas.style("z-index", 0);
			if(!page.element.querySelector("h1")){
				let color = sketch.color(0,0,0)
				sketch.drawPageBorder(color);
				sketch.drawPageTop(color);
			}
		};

		sketch.drawPageBorder = (color) => {
			sketch.background(255);
			let step = sketch.height / numChapters;
			let left = dimensions.bleed.left;
			if (isRight) {
				left = sketch.width - dimensions.bleed.right;
			} 
			sketch.strokeWeight(20);
			sketch.stroke(color);	
			let t1 = 0;
			let b1 = step * ( currChapter - 1 );
			let t2 = step * currChapter;
			let b2 = sketch.height;
			sketch.line(left, t1, left, b1 );
			sketch.line(left, t2, left, b2 );
		
			for(let i = 0; i < 4; i++ ){
				let l = left + i * 3;
				if (isRight) {
					l = left - i * 3;
				}
				let b = sketch.random(t1,b1);
				let t = sketch.random(t1,b);
				sketch.line(l, t, l, b );
				b = sketch.random(t2,b2);
				t = sketch.random(t2,b);
				sketch.line(l, t, l, b );
			}
			// Alternatively, convert the sketch to on image and set it as background of the page
			// let dataurl = canvas.canvas.toDataURL('image/png');
			// canvas.parent().style.backgroundImage = dataurl;
			// canvas.style.display = "none";
		}

		sketch.drawPageTop = (color) => {
			sketch.stroke(color);	
			let top = dimensions.bleed.top;
			let bottom = sketch.height - dimensions.bleed.bottom;
			if( isRight ) {
				sketch.borderLine(".pagedjs_margin-top-left", top);
				/* Feels like I'm going to lose my mind
				You just keep on pushin' my love
				Over the ... */
				sketch.borderLine(".pagedjs_margin-top-right", top);
			} else {
				sketch.borderLine(".pagedjs_margin-top-center .pagedjs_margin-content", top); // modified the css a bit so the .pagedjs_margin-content is not 100%
			}
			sketch.borderLine(".pagedjs_margin-bottom-center .pagedjs_margin-content", bottom);
		}

		sketch.borderLine = (selector, y) => {
			const tc = page.element.querySelector(selector);
			let left = dimensions.bleed.left ;//+ dimensions.margin.left;
			if(tc.offsetWidth > 0) {
				sketch.line(left + tc.offsetLeft, y, left+ tc.offsetLeft + tc.offsetWidth, y );
			}	
		}

		sketch.getDimensions = () => {
			let dimensions = {}
			dimensions.bleed = sketch.getElementDimensions('bleed');
			dimensions.margin = sketch.getElementDimensions('margin');
			return dimensions;
		}

		sketch.getElementDimensions = (area) => {
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