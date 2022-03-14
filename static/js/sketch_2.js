function renderSketch(page, num, total, numChapters, currChapter){
	let isRight = page.element.classList.contains("pagedjs_right_page");


	const s = (sketch) => {
		let canvas;
		let colors = {
			'green': sketch.color(90,106,92), //#5A6A5C
			'brown': sketch.color(185,108,54), //#B96C36
			'blue': sketch.color(98,128,148), // #628094
			'default': sketch.color(98,128,148), // #628094
		};
		sketch.setup = () => {
			sketch.noiseSeed(1);	
			let el = page.element.querySelector(".pagedjs_pagebox");
			canvas = sketch.createCanvas(el.offsetWidth, el.offsetHeight, sketch.SVG);
			canvas.parent(el);
			canvas.position(0, 0);
			canvas.style("z-index", "-1");
			// sketch.background(220);
			if(!page.element.querySelector("h1")){
				// let chap = page.element.getElementsByClassName('.chapter');
				// console.log(chap)
				// let c = getComputedStyle(page.element).getPropertyValue('--base-color').trim() || getComputedStyle(chap).getPropertyValue('--base-color').trim() || 'default';
				let c = getComputedStyle(page.element).getPropertyValue('--base-color').trim() || 'default';
				let color = colors[c] || colors["default"];
				color.setAlpha(100);
				// console.log("color1", color)
				sketch.drawPageBorder(color);
				// sketch.drawPageTop(color);
			}
		};

		sketch.drawPageBorder = (color) => {
			sketch.noStroke();
			let c = sketch.color(color);
			let left = 0;
			if (isRight) {
				left = sketch.width - 10	;
			} 
			const step = sketch.height / numChapters;
			for( let i = 0; i < numChapters; i++ ){
				let p = isRight ? (i + 10) / 5 : i / 5;
				let noise_val = sketch.constrain(sketch.map(sketch.noise(p,num/10), 0.3, 0.7, 0, 255),0,255);
				// console.log("color2", color)
				color.setAlpha(noise_val)
				sketch.fill(color);
				if( i !== currChapter ){
					sketch.rect( left, i * step, 10, step );
				}
			}
			  
			
			// sketch.fill(color);
			// sketch.noStroke();
			// let step = sketch.height / numChapters;
			// let left = 0;
			// if (isRight) {
			// 	left = sketch.width;
			// } 
			// // sketch.rect( left, 0, 10, step * ( currChapter - 1 ) );
			// // sketch.rect( left, step * ( currChapter ), 10 , sketch.height );
			// sketch.strokeWeight(20);
			// sketch.stroke(color);	
			// let t1 = 0;
			// let b1 = step * ( currChapter - 1 );
			// let t2 = step * currChapter;
			// let b2 = sketch.height;
			// sketch.line(left, t1, left, b1 );
			// sketch.line(left, t2, left, b2 );
		
			// for(let i = 0; i < 4; i++ ){
			// 	let l = left + i * 3;
			// 	if (isRight) {
			// 		l = left - i * 3;
			// 	}
			// 	let b = sketch.random(t1,b1);
			// 	let t = sketch.random(t1,b);
			// 	sketch.line(l, t, l, b );
			// 	b = sketch.random(t2,b2);
			// 	t = sketch.random(t2,b);
			// 	sketch.line(l, t, l, b );
			// }
		}

		// sketch.draw = () => {};
	};

	let myp5 = new p5(s); 
}