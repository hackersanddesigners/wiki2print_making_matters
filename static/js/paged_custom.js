this.ready = new Promise(function ($) {
	document.addEventListener("DOMContentLoaded", $, { once: true });
});


class MM_Handler extends Paged.Handler {
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
		this.chunker = chunker;
		this.polisher = polisher;
		this.caller = caller;
	}

	beforeParsed(content) {
		let c = content.querySelector(".mw-parser-output");
		let n = document.createElement("span")
		n.setAttribute("class", 'book-title');
		n.innerHTML = "Making Matters<br/>A Vocabulary for Collective Arts";
		c.prepend(n);
		// remove toc heading
		content.querySelector("#mw-toc-heading").remove();
	}
}

ready.then(async function () {
	// TODO: move to separate function
	// add url params as class to body for debugging. 
	// example: add `?debug` to uri, body gets class 'debug', write class .debug
	let params = new URLSearchParams(window.location.search);
	for(var par of params.entries()) {
		document.body.classList.add(par[0]); //key
 	}
		
	let flowText = document.querySelector("#source");
	
	let t0 = performance.now();
	Paged.registerHandlers(MM_Handler);
	let paged = new Paged.Previewer();

	paged.preview(flowText.content).then((flow) => {
		let t1 = performance.now();
		console.log( "Rendering Pagedjs " + flow.total + " pages took " + (t1 - t0) + " milliseconds.");
		t0 = performance.now();
		const no_p5 = new URLSearchParams(window.location.search).has("no_p5"); // save some time by disabling the p5js backgrounds
		if (!no_p5) {
			let numChapters = document.querySelectorAll("h1 .mw-headline").length;
			let currChapter = 0;
			for (const i in flow.pages) { 
				let page = flow.pages[i]; 
				addPageNumbersToToc(page);
				alignImagesToBaseline(12);
			}
			let i = 0;
			let render = () => {
				let page = flow.pages[i]; 
				let hasH1 = page.area.querySelector("h1");
				if (hasH1) currChapter++;
				this.renderSketch( page, parseInt(i) + 1, flow.pages.length, numChapters, currChapter );
				if(i<flow.pages.length-1) {
					setTimeout(render, 10);
					i++;
				}
			}
			render(flow.pages);
		}
		t1 = performance.now();
		console.log( "Rendering backgrounds for " + flow.total + " pages took " + (t1 - t0) + " milliseconds.");
	});

	let addPageNumbersToToc = (page) => {
		const pages = document.querySelector('.pagedjs_pages');
		let H2 = page.area.querySelector("h2");
		if (H2) {
			let title = H2.textContent.trim();
			let auth = H2.nextSibling.textContent.trim();
			let titles = document.querySelectorAll('.toclevel-2 .toctext');
			titles.forEach((tocText, i) => {
				if(tocText.textContent.includes(title)){ console.log(tocText)
					if(!tocText.nextElementSibling || tocText.nextElementSibling.textContent.includes(auth)) {
						const span = document.createElement("span");
						span.className = "tocPageNumber";
						span.innerText = page.position + 1;
						tocText.parentNode.appendChild(span);
					}
				}
			});
		}
	}

	let alignImagesToBaseline = (gridSize) => {
		const imgs = document.querySelectorAll('img');
		let rythm = gridSize / 72 * 96; // convert pt to px
		imgs.forEach((img, i) => {
			img.parentNode.parentNode.classList.add("image-container") // add class to p remove margins
			let newH = Math.floor( img.clientHeight / rythm );
			img.style.height = newH * rythm + "px";
		});
	};

	let resizer = () => {
		let pages = document.querySelector(".pagedjs_pages");

		if (pages) {
			let scale = (window.innerWidth * 0.9) / pages.offsetWidth;
			if (scale < 1) {
				pages.style.transform = `scale(${scale}) translate(${window.innerWidth / 2 - (pages.offsetWidth * scale) / 2
					}px, 0)`;
			} else {
				pages.style.transform = "none";
			}
		}
	};
	resizer();

	window.addEventListener("resize", resizer, false);

	paged.on("rendering", () => {
		resizer();
	});
});

