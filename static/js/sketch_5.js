

class sketchData {
	STATE = []
	constructor(){
		for(let chapter = 0; chapter < 8; chapter++ ){
			this.STATE[chapter] = {};
			this.STATE[chapter]['left'] = [] // keep "score" for each line
			this.STATE[chapter]['right'] = [] // keep "score" for each line
		}
		// console.log( this.STATE)
	}

	foundTerm(chapter, value, line, side ){
		this.STATE[chapter][side][line] = value;
		// console.log(`set "${chapter}" line ${line} to ${this.STATE[chapter][side][line]}`)
	}

	// decrement the 'score' for each line
	update() {
		for(let chapter = 0; chapter < this.STATE.length; chapter++) {
			let sides = ['left','right'];
			for(let j = 0; j < sides.length; j++ ){
				let side = sides[j];
				const keys = Object.keys(this.STATE[chapter][side]);
				keys.forEach((line, index) => {
					if(this.STATE[chapter][side][line] > 0){
						this.STATE[chapter][side][line] *= 0.9;
						// console.log(`decrement page ${chapter}/${side}, line ${line} to ${this.STATE[chapter][side][line]}`)
					}
				} );
			}
		}
	}
}


class Sketch_Handler extends Paged.Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
		this.chunker = chunker;
		this.polisher = polisher;
		this.caller = caller;
	}

	afterRendered(pages) {
		window._sketch_ = new sketchData()
	}
}


ready.then(async function () {
	Paged.registerHandlers(Sketch_Handler);
});

function renderSketch(page, num, total, numChapters, currChapter){
	// get all the chapters (from the TOC) and wrap them in a <mark></mark> tag
	let isLeft = page.element.classList.contains("pagedjs_left_page"); // for positioning below
	
	const s = (sketch) => {
		let canvas, el;
		let dimensions = {};
		let lineHeight = 16; // baseline grid is 12pt => 16px
		let lineHeightHalf = lineHeight/2; // for convience
		
		sketch.setup = () => {
			el = page.element;
			// console.log(el)
			canvas = sketch.createCanvas(el.offsetWidth, el.offsetHeight, sketch.SVG);
			canvas.parent(el);
			canvas.position(0, 0);
			canvas.style("z-index", 0);
			sketch.ellipseMode(sketch.CENTER);
			dimensions.bleed = sketch.getDimensions('bleed');
			dimensions.margin = sketch.getDimensions('margin');
			let left = dimensions.bleed.left + 2;// start at 2px of the left margin
			let step = 2; // move line for each chapter 1px to the right
			if (!isLeft) {
				left = sketch.width - dimensions.bleed.right - 2; // start at 2px of the right margin
				step = - 2; // move line 1px left
			} 

			sketch.findMarks(page);
			sketch.drawMarks(left, step, currChapter, numChapters);
			sketch.drawPageTop();
			
			if (!isLeft) {
				window._sketch_.update() // on a new spread we decrement all the values
			}

		};

		sketch.drawMarks = (left,step, currChapter, numChapters) => {
			const s = window._sketch_.STATE; // preserve the data in a global object
			const keys = Object.keys(s);
			sketch.strokeWeight(12);
			sketch.noFill();
			sketch.ellipseMode(sketch.CENTER)
			let chapStep = sketch.height / numChapters;
			let x = left;
			keys.forEach((chapter, index) => {
				// chapter = keys[0]
				sketch.stroke(0)
				let t1 = 0;
				let b1 = chapStep * ( currChapter - 1 ); // top of chapter gap
				let t2 = chapStep * currChapter; // bottom of chapter gap
				let b2 = sketch.height;
				sketch.line(x, t1, x, b1 );
				sketch.line(x, t2, x, b2 );

				let lines = window._sketch_.STATE[chapter][isLeft ? "left" : "right"];
				// console.log(lines, window._sketch_.STATE)
				let y = 0;
				const keys = Object.keys(lines);
				// console.log(keys)	
				keys.forEach((i, inx) => {
					// console.log(lines[i], i)
					if( lines[i] > 0 ) {
						let depth = lines[i];
						if(!isLeft) depth *= -1;
						let from = sketch.lineNumberToPx(i);
						let to = from + 16;
						if ( (from < b1 && to < b1 ) || from > t2 ) { // only if line does not overlap chapter gap
							sketch.line(x+depth,from,x+depth,to)
						}
					}
				});	
			});
		}

		

		sketch.drawPageTop = () => {
			let top = dimensions.bleed.top;
			let bottom = sketch.height - dimensions.bleed.bottom;
			if( !isLeft ) {
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

		sketch.getPoints = (chapter, side) => {
			let lines = window._sketch_.STATE[chapter][side];
			let points = [];
			for( let i = 0; i < lines.length; i++ ){
				if( lines[i] > 0 ) {
					points.push([i,lines[i]])
				}
			}
			return points;
		}

		sketch.findMarks = (page) => {
			let marks = el.querySelectorAll("mark"); // find all mark elements on this page
			for( let i = 0; i < marks.length; i++ ) {
				let mark = marks[i];
				let num = parseInt(mark.className.substring(1))
				let top = mark.offsetTop; 
				let line = sketch.topToLine(top);
				// console.log(`found chapter ${num} at line ${line+1} on page ${page.position + 1}` )
				this._sketch_.foundTerm(num,10,line,isLeft?"left":"right");
				this._sketch_.foundTerm(num,sketch.random(3,6),line - 1,isLeft?"left":"right");
				this._sketch_.foundTerm(num,sketch.random(3,6),line + 1,isLeft?"left":"right");
			}
		}
		sketch.pointer = (x, y, d, invert) => {
			let n = d / 10; // normalized
			let o  = n * n * 30; // quadratize to make non linear
			if ( invert ) {
				o *= -1;
			}
			sketch.bezier(x, y-d, x, y, x, y, x-o, y)
			sketch.bezier(x-o, y, x, y, x, y, x, y+d)
		}

		sketch.topToLine = ( top ) => {
			return Math.floor( ( top + lineHeightHalf) / lineHeight );
		}

		sketch.lineNumberToPx = ( line ) => {
			// return Math.floor( ( top + lineHeightHalf) / lineHeight );
			
			let t = dimensions.margin.top + dimensions.bleed.top;
			let p = line * lineHeight
			return t + p;
		}

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