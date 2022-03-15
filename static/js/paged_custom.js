this.ready = new Promise(function ($) {
	document.addEventListener("DOMContentLoaded", $, { once: true });
});


class MM_Handler extends Paged.Handler {
	t0 = 0; t1 = 0;
	constructor(chunker, polisher, caller) {
		super(chunker, polisher, caller);
		this.chunker = chunker;
		this.polisher = polisher;
		this.caller = caller;
	}

	insertDocumentTitle(content) {
		let c = content.querySelector(".mw-parser-output");
		let n = document.createElement("span")
		n.setAttribute("class", 'book-title');
		n.innerHTML = "Making Matters<br/>A Vocabulary for Collective Arts";
		c.prepend(n);
	}

	beforeParsed(content) {
		insertUIStyle();
		this.insertDocumentTitle(content);
		// remove toc heading
		content.querySelector("#mw-toc-heading").remove();

		// let h1s = content.querySelectorAll("h1"); console.log(h1s)
		// for(let i = 0; i < h1s.length; i++ ) {
		// 	let h1 = h1s[i]
		// 	let text = h1.innerText.trim();
		// 	let url =  "/plugins/Making_Matters_Lexicon/static/images/" + text + ".svg";
		// 	fetch(url, { method: 'HEAD' })
		// 	.then(res => {
		// 		if (res.ok) {
		// 			const div = document.createElement("div");
		// 			div.className = 'title-page';
		// 			div.id="title-page";
		// 			const img = document.createElement("img");
		// 			img.alt = text;
		// 			img.src = url;
		// 			img.className = 'full';
		// 			div.appendChild(img);
		// 			// h1.parentNode.replaceChild(img, h1)
		// 			h1.parentNode.insertBefore(div, h1.nextSibling)
		// 			// let html = `
		// 			// <div class="empty-left-page">??</div>
		// 			// <div class="title-page"><img src="${url}" alt="${text}"/></div>
		// 			// `;
		// 			// let n = document.createRange().createContextualFragment(html);
		// 			// h1.parentNode.replaceChild(n, h1)
		// 		} else {
		// 			console.log('Chapter image missing for ' + text);
		// 		}
		// 	}).catch(err => console.log('Error:', err));
		// }
	}

	afterPreview(pages) {
		this.t0 = performance.now();
		let numChapters = document.querySelectorAll("h1 .mw-headline").length;
		let currChapter = 0;
		for (const i in pages) { 
			let page = pages[i]; 
			this.addPageNumbersToToc(page);
			this.alignImagesToBaseline(12);
		}
		this.renderBackground(pages, currChapter, numChapters, 0);
	}

	renderBackground( pages, currChapter, numChapters, idx ) {
		let page = pages[idx]; 
		let hasH1 = page.area.querySelector("h1");
		if (hasH1) currChapter++;
		if(typeof renderSketch === 'function'){
			renderSketch( page, idx + 1, pages.length, numChapters, currChapter );
		}
		if(idx < pages.length - 1) {
			// setTimeout(render, 10);
			idx++;
			this.renderBackground(pages, currChapter, numChapters, idx);
		} else {
			removeLoadingMessage();
			this.t1 = performance.now();
			console.log( "Rendering backgrounds for " + pages.length + " pages took " + (this.t1 - this.t0) + " milliseconds.");
		}
	}

	addPageNumbersToToc (page) {
		const pages = document.querySelector('.pagedjs_pages');
		let H2 = page.area.querySelector("h2");
		if (H2) {
			let title = H2.textContent.trim();
			let auth = H2.nextSibling.textContent.trim();
			let titles = document.querySelectorAll('.toclevel-2 .toctext');
			titles.forEach((tocText, i) => {
				if(tocText.textContent.includes(title)){
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

	alignImagesToBaseline (gridSize) {
		const imgs = document.querySelectorAll('img:not(.full)');
		let rythm = gridSize / 72 * 96; // convert pt to px
		imgs.forEach((img, i) => {
			img.parentNode.parentNode.classList.add("image-container") // add class to p remove margins
			let newH = Math.floor( img.clientHeight / rythm );
			img.style.height = newH * rythm + "px";
		});
	};


}

ready.then(async function () {
	// paramsToClass();
	loadingMessage();
	ui();
		
	let flowText = document.querySelector("#source");
	
	let t0 = performance.now();
	Paged.registerHandlers(MM_Handler);
	let paged = new Paged.Previewer();

	paged.preview(flowText.content).then((flow) => {
		let t1 = performance.now();
		console.log( "Rendering Pagedjs " + flow.total + " pages took " + (t1 - t0) + " milliseconds.");		
	});

	
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

let insertUIStyle = () => {
	const style = document.createElement('style');
	style.innerHTML = `
		@media only print {
      .print-ui {
        display: none !important	;
      }
		}
		.print-ui {
			position: fixed;
			display: block;
		}
    `;
	// document.querySelectorAll('.print-ui').style.display = "block"; // only block for now?
	document.head.appendChild(style);
}

let ui = () => {
	let queryParams = new URLSearchParams(window.location.search);
	const select = document.getElementById("sketch");
	select.addEventListener('change', (event) => {
		queryParams.set("sketch", select.value);
		history.replaceState(null, null, "?"+queryParams.toString());
		window.location.reload(false)
	});
	const grid_check = document.getElementById("grid");
	grid_check.addEventListener('change', (event) => {
		value = grid_check.checked == 1 ? 1 : 0;
		queryParams.set("grid", value);
		history.replaceState(null, null, "?"+queryParams.toString());
		if( value == 0 ) {
			document.body.classList.remove('grid');
		} else {
			document.body.classList.add('grid');
		}
	});
}

let loadingMessage = () => {
	let html = `<span class="loading-message"><span class="lds-heart"><div></div></span>Rendering...</span>`;
	let n = document.createRange().createContextualFragment(html);
	n.firstElementChild.style.position = "fixed"
	document.body.append(n)
}

let removeLoadingMessage = () => {
	let elem = document.querySelector(".loading-message");
	elem.textContent = "Done."
	setTimeout(()=>{elem.parentNode.removeChild(elem)}, 1000);
}

let paramsToClass = () =>{
	// add url params as class to body for debugging. 
	// example: add `?debug` to uri, body gets class 'debug', write class .debug
	let params = new URLSearchParams(window.location.search);
	for(var par of params.entries()) {
		document.body.classList.add(par[0]); //key
 	}
}