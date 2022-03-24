

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
		console.log(value, chapter, line, side, this.STATE[chapter][side][line], this.STATE[chapter][side])
		// if(	this.STATE[chapter][side][line] ) {
		// 	this.STATE[chapter][side][line] += value;
		// } else {
			this.STATE[chapter][side][line] = value;
		// }
		console.log(`set "${chapter}" line ${line} to ${this.STATE[chapter][side][line]} ${value}`)
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
						this.STATE[chapter][side][line] *= 0.8;
						if(this.STATE[chapter][side][line] < 0.5){
							this.STATE[chapter][side][line] = 0;
						}
						// console.log(`decrement page ${chapter}/${side}, line ${line} to ${this.STATE[chapter][side][line]}`)
					}
				} );
			}
		}
	}

	lineScore( line, side ) {
		let score = 0;
		for(let chapter = 0; chapter < this.STATE.length; chapter++) {
			// console.log("chap", chapter, this.STATE[chapter], side, this.STATE[chapter][side] )
			if(this.STATE[chapter][side][line]){
				score += this.STATE[chapter][side][line];
			}		
		}
		return score
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
			
			sketch.findMarks(page);
			sketch.drawMarks(currChapter, numChapters);
			sketch.drawPageTop();

			if (!isLeft) {
				window._sketch_.update() // on a new spread we decrement all the values
			}

		};

		sketch.drawMarks = (currChapter, numChapters) => {
			const s = window._sketch_.STATE; // preserve the data in a global object
			sketch.noFill();
			sketch.ellipseMode(sketch.CENTER)
			sketch.stroke(0)
			let chapStep = sketch.height / numChapters;
			
			let b1 = chapStep * ( currChapter - 1 ); // top of chapter gap
			let t2 = chapStep * currChapter; // bottom of chapter gap

			let x1 = dimensions.bleed.left + 3;// start at 2px of the left margin
			let x2 = dimensions.bleed.left + 8;// start at 2px of the left margin
			if (!isLeft) {
				x1 = sketch.width - dimensions.bleed.right - 3; // start at 2px of the right margin
				x2 = sketch.width - dimensions.bleed.right - 8; // start at 2px of the right margin
			} 

			let x = x2;
			let y = 0;
			let xx,yy;
			let side = isLeft ? "left" : "right";
			let lh = 16; // lineheight
			sketch.beginShape();
			sketch.vertex(x, 0);
			y = sketch.lineNumberToPx(0) - lh/2;
			sketch.vertex(x, y);
			sketch.strokeWeight(4);

			sketch.line(x1,0,x1,b1);
			sketch.line(x1,t2,x1,sketch.height);
			
			for( let i = 0; i < 50; i++) {
				// sketch.noFill();
				// sketch.strokeWeight(1)
				// sketch.stroke(1)
				
				let depth = window._sketch_.lineScore(i, side);
				if(!isLeft) depth *= -1;
				yy = sketch.lineNumberToPx(i) + 8;
				xx = x2 + depth;
				// sketch.bezierVertex( x, y + lh/2, xx, yy - 10, xx, yy - 3 );
				// sketch.vertex(xx, yy);

				sketch.bezierVertex( x, y + lh/2, xx, yy - lh/2, xx, yy );
				sketch.vertex(xx, yy);
				console.log(depth)
				// if(depth >= 8 ) {
				// 	sketch.ellipse(x2 + 1, yy, 2 );
				// } else if(depth <= -8) {
				// 	sketch.ellipse(x2 -1, yy, 2 );
				// }
				// sketch.fill(sketch.random(255), sketch.random(255), sketch.random(255))
				// sketch.noStroke();
				// sketch.ellipse(x, y + 8, 2 )
				// sketch.ellipse(xx, yy - 8 )
				y = yy;
				x = xx;
				// if ( (from < b1 && to < b1 ) || from > t2 ) { // only if line does not overlap chapter gap
				// }
			};

			sketch.endShape();
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
				this._sketch_.foundTerm(num, 8,line,isLeft?"left":"right");
				// this._sketch_.foundTerm(num,sketch.random(3,6),line - 1,isLeft?"left":"right");
				// this._sketch_.foundTerm(num,sketch.random(3,6),line + 1,isLeft?"left":"right");
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