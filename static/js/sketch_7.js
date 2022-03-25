/*
class to store the position of the marked keywords 
in the book
*/
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

/*
Draws a shape in the sideline of the book.
Lines should move slightly based on noise
*/
class noiseShape {
  constructor( opts, y_offset, depth, min, max, seed_offset ){
		this.s = opts.sketch;
    this.GAP_TOP = opts.gap_top; // gap
    this.GAP_BOTTOM = opts.gap_bottom;
		this.is_left = opts.is_left; // is left page
		this.start_left = opts.start_left; // x start position if left page
		this.start_right = opts.start_right; // x start if right page

		this.y_offset = y_offset; // y position, roughly top
    this.depth = depth; // width
    this.min = min; // min height
    this.max = max; // max height
		this.seed_offset = seed_offset; // noise offset

		this.thres = 20; // min cut off height 
  }
  
  draw(cnt, is_left){
		// if( this.is_left != isLeft) return;
		this.is_left = is_left;
    let draw = true;
		this.s.fill(0);
		this.s.noStroke();
		this.s.rectMode(this.s.CORNERS)
		let o = this.seed_offset;
		if( !this.is_left ) o += 1000; // offset the noise for the right page
    let y1 = this.y_offset + this.s.noise(cnt+o) * 100
    let y2 = y1 + this.min + ( this.s.noise(cnt+o+1000) * (this.max - this.min ))
    if(y1 > this.GAP_TOP && y1 < this.GAP_BOTTOM ) { 
      if( y2 > this.GAP_TOP && y2 < this.GAP_BOTTOM ) {
        draw = false; // line falls in gap
      } else {
        y1 = this.GAP_BOTTOM; // line top in gap
      }
    } else if (y2 > this.GAP_TOP && y2 < this.GAP_BOTTOM) {
      y2 = this.GAP_TOP // line bottom in gap
    } else if( y1 < this.GAP_TOP && y2 > this.GAP_BOTTOM ) {
      draw = false; // line overlaps gap, chop into two pieces:
      if( this.GAP_TOP - y1 > this.thres ) { // top piece, if height bigger than thres
				// this.s.rect(this.x, y1, this.x + this.depth, this.GAP_TOP, 0, 10, 10, 0)  
				this.drawShape(this.s,this.x, y1, this.depth, this.GAP_TOP)  
      }
      if( y2 - this.GAP_BOTTOM > this.thres ) { // bottom piece
				// this.s.rect(this.x, this.GAP_BOTTOM, this.x + this.depth, y2, 0, 10, 10, 0)  
				this.drawShape(this.s, this.x, this.GAP_BOTTOM, this.depth, y2)  
      }
    }
    if( draw && y2 - y1 > this.thres) {
			// this.s.rect(this.x, y1, this.x + this.depth, y2, 0, 10, 10, 0)
			this.drawShape(this.s, this.x, y1, this.depth, y2)
    }
    //  this.s.line(this.x - 2, y1, this.x - 2 , y2)
  }

	drawShape(s, x1, y1, w, y2 ){
		let c1 = 0, c2 =0, c3 = 0, c4 = 0;
		if( this.is_left ) {
			x1 = this.start_left;
			c2 = 10, c3 = 10;
			s.rect(x1, y1, x1 + this.depth, y2, c1, c2, c3, c4)
		} else {
			x1 = this.start_right
			c1 = 10, c4 = 10;
			s.rect(x1 - this.depth, y1, x1 , y2, c1, c2, c3, c4)
		}
	}
}

let cnt = 0;
function renderSketch(page, num, total, numChapters, currChapter){
	// get all the chapters (from the TOC) and wrap them in a <mark></mark> tag
	let isLeft = page.element.classList.contains("pagedjs_left_page"); // for positioning below
	
	const s = (sketch) => {
		let canvas, el;
		let dimensions = {};
		let lineHeight = 16; // baseline grid is 12pt => 16px
		let lineHeightHalf = lineHeight/2; // for convience
		let shapes = [];
		
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
			

			let chapStep = ( sketch.height - dimensions.bleed.top - dimensions.bleed.bottom ) / ( numChapters + 1 );
			let gap_top = chapStep * currChapter + dimensions.bleed.top; // top of chapter gap
			let gap_bottom = chapStep * ( currChapter + 1 ) + dimensions.bleed.top; // bottom of chapter gap

			let opts = {
				sketch: sketch,
				is_left: isLeft,
				gap_top: gap_top,
				gap_bottom: gap_bottom,
				start_left: dimensions.bleed.left,
				start_right: sketch.width - dimensions.bleed.right
			}
			
			shapes.push(new noiseShape(opts, 0, 5, 10, sketch.height/2, 10 ));
			shapes.push(new noiseShape(opts, 200, 10, 50, 400, 100 ));
			shapes.push(new noiseShape(opts, sketch.height - 150	, 10, 150, 400, 1000 ));

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

			let chapStep = ( sketch.height - dimensions.bleed.top - dimensions.bleed.bottom ) / ( numChapters + 1 );
			let gap_top = chapStep * currChapter + dimensions.bleed.top; // top of chapter gap
			let gap_bottom = chapStep * ( currChapter + 1 ) + dimensions.bleed.top; // bottom of chapter gap

			
			// fixed lines 
			sketch.noStroke()
			sketch.fill(0)	
			let w = - 10;
			if( isLeft ) {
				start = dimensions.bleed.left;// start at 2px of the left margin
			} else  {
				w = 10;
				start = sketch.width - dimensions.bleed.right; // start at 2px of the right margin
			}

			// sketch.rect(start, 0, start + w, gap_top, 10) // from top to gap
			// sketch.rect(start, gap_bottom, start + w, sketch.height, 10) // from gap to bottom

			// random shapes
			console.log("SHAPES 2", shapes, isLeft?"left":"right")
			for( let i = 0; i< shapes.length; i++) {
				console.log(shapes, shapes[i], cnt)
				shapes[i].draw(cnt, isLeft)
			}
			// let x = x2;
			// let y = 0;
			// let xx,yy;
			// let side = isLeft ? "left" : "right";
			// let lh = 16; // lineheight
			// sketch.beginShape();
			// sketch.vertex(x, 0);
			// y = sketch.lineNumberToPx(0) - lh/2;
			// sketch.vertex(x, y);
			// sketch.strokeWeight(4);

			// sketch.line(x1,0,x1,gap_top);
			// sketch.line(x1,gap_bottom,x1,sketch.height);
			
			// for( let i = 0; i < 50; i++) {
			// 	// sketch.noFill();
			// 	// sketch.strokeWeight(1)
			// 	// sketch.stroke(1)
				
			// 	let depth = window._sketch_.lineScore(i, side);
			// 	if(!isLeft) depth *= -1;
			// 	yy = sketch.lineNumberToPx(i) + 8;
			// 	xx = x2 + depth;
			// 	// sketch.bezierVertex( x, y + lh/2, xx, yy - 10, xx, yy - 3 );
			// 	// sketch.vertex(xx, yy);

			// 	sketch.bezierVertex( x, y + lh/2, xx, yy - lh/2, xx, yy );
			// 	sketch.vertex(xx, yy);
			// 	console.log(depth)
			// 	// if(depth >= 8 ) {
			// 	// 	sketch.ellipse(x2 + 1, yy, 2 );
			// 	// } else if(depth <= -8) {
			// 	// 	sketch.ellipse(x2 -1, yy, 2 );
			// 	// }
			// 	// sketch.fill(sketch.random(255), sketch.random(255), sketch.random(255))
			// 	// sketch.noStroke();
			// 	// sketch.ellipse(x, y + 8, 2 )
			// 	// sketch.ellipse(xx, yy - 8 )
			// 	y = yy;
			// 	x = xx;
			// 	// if ( (from < gap_top && to < gap_top ) || from > gap_bottom ) { // only if line does not overlap chapter gap
			// 	// }
			// };

			// sketch.endShape();

			cnt+= 0.1;
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


/* Plug in to Pagedjs */
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

/* on page ready */
ready.then(async function () {
	Paged.registerHandlers(Sketch_Handler);
});