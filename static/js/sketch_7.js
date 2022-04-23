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
	}

	foundTerm(chapter, value, line, side ){
		this.STATE[chapter][side][line] = value;
		// console.log(`set "${chapter}" line ${line} to ${this.STATE[chapter][side][line]} ${value}`)
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
			this.el = el;
			// console.log(el)
			canvas = sketch.createCanvas(el.offsetWidth, el.offsetHeight, sketch.SVG);
			canvas.parent(el);
			canvas.position(0, 0);
			canvas.style("z-index", 0);
			
			sketch.ellipseMode(sketch.CENTER);
			sketch.rectMode(sketch.CORNERS);
			sketch.noiseSeed(1);

			dimensions.bleed = sketch.getDimensions('bleed');
			dimensions.margin = sketch.getDimensions('margin');
			
			sketch.findMarks(page);
			
			this.numLines = Math.floor( ( sketch.height - dimensions.bleed.top - dimensions.bleed.bottom - dimensions.margin.top - dimensions.margin.bottom ) / lineHeight ) 

			// the chapter tab starts/stops a bit below/above the adges of the page
			// this.chapStep = ( sketch.height - dimensions.bleed.top * 2 - dimensions.bleed.bottom * 2) / ( numChapters );
			// this.gap_top = chapStep * (currChapter - 1) + dimensions.bleed.top * 2; // top of chapter gap
			// this.gap_bottom = chapStep * ( currChapter  ) + dimensions.bleed.top * 2; // bottom of chapter gap

			// chapter tab uses all space 
			this.chapStep = ( sketch.height - dimensions.bleed.top - dimensions.bleed.bottom ) / ( numChapters );
			this.gap_top = chapStep * (currChapter - 1) + dimensions.bleed.top; // top of chapter gap
			this.gap_bottom = chapStep * ( currChapter  ) + dimensions.bleed.top; // bottom of chapter gap
			
			let opts = {
				sketch: sketch,
				is_left: isLeft,
				gap_top: gap_top,
				gap_bottom: gap_bottom,
				start_left: 0,//dimensions.bleed.left,
				start_right: sketch.width,// - dimensions.bleed.right
			}
			
			//noiseShape( opts, y_offset, depth, min, max, seed_offset ){
			shapes.push(new noiseShape(opts, 0, 24, 10, sketch.height/2, 10 ));
			shapes.push(new noiseShape(opts, 200, 26, 50, 400, 100 ));
			shapes.push(new noiseShape(opts, sketch.height - 150	, 27, 150, 400, 1000 ));
			shapes.push(new noiseShape(opts, sketch.height /2	, 23, 150, 250, 2000 ));

			sketch.drawMarks(currChapter, numChapters);
			sketch.drawPageTop();

			if (!isLeft) {
				window._sketch_.update() // on a new spread we decrement all the values
			}

		};

		sketch.drawMarks = (currChapter, numChapters) => {
			sketch.noStroke()
			sketch.fill(0)	

			let start;
			if( isLeft ) {
				start = dimensions.bleed.left;// start at 2px of the left margin
				sketch.rect(start - dimensions.bleed.left, 0, start + 5, gap_top, 10) // from top to gap
				sketch.rect(start - dimensions.bleed.left, this.gap_bottom, start + 5, sketch.height, 10) // from gap to bottom	
				if( currChapter == 0 || currChapter > numChapters) { // ugly but ugh.
					sketch.rect(start - dimensions.bleed.left, 0, start + 5, sketch.height, 10) // from gap to bottom	
				}
	
			} else  {
				start = sketch.width - dimensions.bleed.right; // start at 2px of the right margin
				sketch.rect(start - 5, 0, start + dimensions.bleed.right, this.gap_top, 10) // from top to gap
				sketch.rect(start - 5, gap_bottom, start + dimensions.bleed.right, sketch.height, 10) // from gap to bottom	
				if( currChapter == 0 || currChapter > numChapters ) { // ugly but ugh.
					sketch.rect(start - 5, 0, start + dimensions.bleed.right, sketch.height, 10) // from gap to bottom	
				}
			}
			
			
			// Update random shapes
			for( let i = 0; i< shapes.length; i++) {
				shapes[i].draw(cnt, isLeft)
			}

			for( let i = 0; i < this.numLines; i++) {
				let y = sketch.lineNumberToPx(i) - lineHeightHalf;
				let side = isLeft ? "left" : "right";
				let depth = window._sketch_.lineScore(i, side);
				if( depth > 0 ){
					sketch.drawMark( start, y, depth + 10, y + lineHeight*2 )
				}
			}
			
			// arrows in the chapter tab/gap
			if(!isLeft) {
				let chap = this.el.querySelector('.chapter')
				if( chap )  {
					let symbol = chap.getAttribute('data-symbol');
					if( !symbol ) symbol = "";
					sketch.textFont("Symbola");
					sketch.textSize(16);
					sketch.textAlign(sketch.RIGHT)
					let l = start - 10;//sketch.textWidth(symbol); 
					sketch.text(symbol, l, this.gap_top + (this.gap_bottom-this.gap_top)/2  + 8);// + half fontsize
				}
			}

			cnt+= 1;
		}

		// start, y, depth, y + 16
		sketch.drawMark = (x1, y1, w, y2 ) => {
			sketch.noStroke();
			sketch.fill(0);	
			let c1 = 0, c2 =0, c3 = 0, c4 = 0;

			if(y1 > this.gap_top && y1 < this.gap_bottom || y2 > this.gap_top && y2 < this.gap_bottom ) {
				return;
			}
			if( isLeft ) {
				c2 = 10, c3 = 10;
				sketch.rect(x1, y1, x1 + w, y2, c1, c2, c3, c4)
			} else {
				c1 = 10, c4 = 10;
				sketch.rect(x1 - w, y1, x1 , y2, c1, c2, c3, c4)
			}
		}
	

		sketch.drawPageTop = () => {
			sketch.strokeWeight(20);
			sketch.stroke(0);	
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
