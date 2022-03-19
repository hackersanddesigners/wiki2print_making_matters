

class sketchData {
	TOC_TERMS = ['collective bodies'];
	STATE = {}
	constructor(){
		this.TOC_TERMS = this.getTocTerms();
		console.log(this.TOC_TERMS)
		for(let i = 0; i < this.TOC_TERMS.length; i++ ){
			let term = this.TOC_TERMS[i].toLocaleLowerCase();
			this.STATE[term] = {};
			this.STATE[term]['left'] = [] // keep "score" for each line
			this.STATE[term]['right'] = [] // keep "score" for each line
		}
	}

	foundTerm(term, line, side ){
		term = term.toLocaleLowerCase()
		console.log(`set "${term}" line ${line} to 10`)
		this.STATE[term][side][line] = 10;
	}

	// decrement the 'score' for each line
	update() {
		const keys = Object.keys(this.STATE);
		keys.forEach((term, index) => {
			let sides = ['left','right'];
			for(let j = 0; j < sides.length; j++ ){
				let side = sides[j];
				for(let i = 0; i < this.STATE[term][side].length; i++ ){
					if(this.STATE[term][side][i] > 0){
						this.STATE[term][side][i]--;
						console.log(`decrement "${term}" on ${side} line ${i} to ${this.STATE[term][i]}`)
					}
				}
			}
		});
	}
	getTocTerms() {
		const toc_items = document.querySelectorAll(".pagedjs_left_page li:not(.tocsection-1) .toclevel-2 > a > .toctext, .pagedjs_right_page li:not(li.toclevel-1:last-of-type) .toclevel-2 > a > .toctext"); // get all terms defined in toc. skip intro on left page and acknowledgemetns on right
		// const toc_items = document.querySelectorAll("li:not(.tocsection-1,li.toclevel-1:last-of-type) .toclevel-2 > a > .toctext"); // get all terms defined in 
		// console.log(toc_items)
		let strings = []; 
		for(let i = 0; i < toc_items.length; i++ ){
			let s = toc_items[i].innerText.trim().toLocaleLowerCase()
			if( ! strings.includes(s)) { // remove duplicate terms
				strings.push(s);
			}
		}
		return strings
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
	// get all the terms (from the TOC) and wrap them in a <mark></mark> tag
	let isLeft = page.element.classList.contains("pagedjs_left_page"); // for positioning below
	const ps = page.element.querySelectorAll('.pagedjs_pages p'); // paragraphs
	
	let strings = _sketch_.TOC_TERMS;
	let str = strings.join("|"); // orrrrr
	for( let i = 0; i < ps.length; i++ ) {
		let p = ps[i];
		let re = new RegExp(`(${str})([\s\.<])`, "gim"); // match "artistic research", but not "artistic researchers"
		let text = p.innerHTML;
		text = text.replace(re, (match, p1, p2) => { return "<mark>"+p1+"</mark>"+p2});
		p.innerHTML = text;
	}

	const s = (sketch) => {
		let canvas, el;
		let dimensions = {};
		let lineHeight = 16; // baseline grid is 12pt => 16px
		let lineHeightHalf = lineHeight/2; // for convience
		
		sketch.setup = () => {
			el = page.element;
			canvas = sketch.createCanvas(el.offsetWidth, el.offsetHeight, sketch.SVG);
			canvas.parent(el);
			canvas.position(0, 0);
			canvas.style("z-index", 0);
			sketch.ellipseMode(sketch.CENTER);
			dimensions.bleed = sketch.getDimensions('bleed');
			dimensions.margin = sketch.getDimensions('margin');
			let left = dimensions.bleed.left + 2;// start at 2px of the left margin
			let step = 1; // move line for each term 1px to the right
			if (!isLeft) {
				left = sketch.width - dimensions.bleed.right - 2; // start at 2px of the right margin
				step = -1; // move line 1px left
			} 

			let marks = el.querySelectorAll("mark"); // find all mark elements on this page
			for( let i = 0; i < marks.length; i++ ) {
				let mark = marks[i];
				let text = mark.innerText;
				let top = mark.offsetTop; 
				let line = sketch.topToLine(top);
				console.log(`found term ${text} at line ${line+1} on page ${page.position + 1}` )
				this._sketch_.foundTerm(text,line,isLeft?"left":"right");
			}

			const s = window._sketch_.STATE; // preserve the data in a global object
			const keys = Object.keys(s);
			sketch.strokeWeight(0.1);
			sketch.noFill();
			sketch.ellipseMode(sketch.CENTER)
			let x = left;
			keys.forEach((term, index) => {
				// term = keys[0]
				points = sketch.getPoints( term, isLeft ? "left" : "right"); // get points for term
				if( points.length > 0 ) {
					let line = points[0][0]; // [0] -> line number
					let depth = points[0][1]; // [1] -> 'depth' 10 = current page, lower is previous pages
					let y = 0;
					for(let i = 0; i < points.length; i++){
						line = points[i][0];
						depth = points[i][1];
						let ny = sketch.lineToPoint(line);
						// sketch.line(x, y + lineHeightHalf,x, ny - lineHeightHalf )
						sketch.line(x, y + depth,x, ny - depth )
						sketch.pointer(x,ny,depth,isLeft?true:false);
						y = ny;
						if(depth == 10 ){
							sketch.fill(0);
							sketch.ellipse(x,y,1.5,1.5);
							sketch.noFill();
						}
					}
					// sketch.line(x, y + lineHeightHalf, x, sketch.height) // line from last point to bottom of page
					sketch.line(x, y + depth, x, sketch.height) // line from last point to bottom of page
				} else {
					sketch.line(x,0,x,sketch.height);
				}
				x += step;
			});
			if (!isLeft) {
				window._sketch_.update() // on a new spread we decrement all the values
			}
		};

		sketch.getPoints = (term, side) => {
			let lines = window._sketch_.STATE[term][side];
			let points = [];
			for( let i = 0; i < lines.length; i++ ){
				if( lines[i] > 0 ) {
					points.push([i,lines[i]])
				}
			}
			return points;
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

		sketch.lineToPoint = ( line ) => {
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