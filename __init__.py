import flask
from flask import request
from flask_plugin import Plugin
from api import *
from bs4 import BeautifulSoup
import re, copy, sys
# import config

sys.path.insert(0, '.../../..')
from config import config as conf

WIKI         = conf['wiki']['base_url']
SUBJECT_NS   = conf['wiki']['subject_ns']
STYLES_NS    = conf['wiki']['styles_ns']

sketch = 0

plugin = Plugin(
		static_folder='static',
		template_folder='template'
)
	
@plugin.route('/pdf/<string:pagename>', methods=['GET', 'POST'])
def pagedjs(pagename):	
	publication = get_publication(
		WIKI,
		SUBJECT_NS,
		STYLES_NS,
		pagename,
	)
	sketch = request.args.get("sketch", default=0, type=int)
	grid = request.args.get("grid", default=0, type=int)
	return filter(flask.render_template(
		'custom.html', 
		title = pagename,
		html  = publication['html'],
		sketch = sketch,
		grid = grid,
	))

@plugin.route('/html_filtered/<string:pagename>', methods=['GET', 'POST'])
def filtered_html(pagename):
	publication = get_publication(
		WIKI,
		SUBJECT_NS,
		STYLES_NS,
		pagename,
	)
	return filter(flask.render_template(
		'inspect.html', 
		title = pagename,
		html  = publication['html'],
		css   = publication['css']
	))

def filter(html):
	print("filtering...")	
	soup = BeautifulSoup(html, 'html.parser')
	soup = add_author_names_toc(soup)
	soup = insertEmptyPageAfterTitle(soup)
	soup = imageSpreads(soup)
	html = soup.prettify() # dont use prettify. It causes whitespace in layout in some instances #str(soup)#
	html = replaceSymbol(html)
	html = removeSrcSets(html)
	return html

def replaceSymbol(html):
	html = re.sub(r"↵", "<span class='font-symbola'>⇝</span>", html)
	return html

# somethings wrong with the srcsets from the wiki. We originals anyway.
def removeSrcSets(html):
	"""
		html = string (HTML)
	"""
	html = re.sub(r"srcset=", "xsrcset=", html)
	return html

# somehow Beautifulsoup unhides the caching comment
# let's remove it :)
# def removeCacheReport(html):
# 	import re
# 	html = re.sub(r"NewPP limit report.+JSON.", "", html, flags=re.DOTALL)
# 	return html

def insertEmptyPageAfterTitle(soup):
	h1s = soup.find_all("h1")
	skip = ["introduction",""]
	for h1 in h1s: # based on this: https://gitlab.coko.foundation/pagedjs/pagedjs/-/wikis/Quick-solution-&-fix-to-layout-problems
		text = h1.span.string
		if(text):
			text = text.strip() # get h1 text.
		else:
			text = ""
		if( text not in skip ):
			src = "/plugins/Making_Matters_Lexicon/static/images/" + text + ".svg"; # image source. name has to match chapter title
			img = soup.new_tag('img', **{ "alt": "image for chapter title " + text, "src": src, "class": "full", "title": text})
			section = createSpreadSection( soup, img )
			section['class'] = section['class'] + ["title-spread"]	
			h1.replace_with(section) # replaces h1
			title = soup.new_tag('div',**{'class': 'chapter-title', 'style': 'display:none'}) # we need this for chapter titles in margin
			title.string = text
			section.div.div.append(title)
	return soup

def createSpreadSection(soup, img):
	section = soup.new_tag('section', **{"class": 'full-spread-image-section'}) # outer section
	fpi = soup.new_tag('div', **{"class":'full-page-image full-page-image-left'}) # outer wrapper for image
	div = soup.new_tag('div') # inner wrapper for image
	if( img ):
		div.append(img) # image in inner div
	else:
		print( "missing image for spread?	")
	fpi.append(div) # div in outer wrapper
	section.append(fpi) # wrapper in section
	fpi2 = copy.copy(fpi)  # copied
	fpi2['class'] = "full-page-image"
	section.append(fpi2)
	return section
	# h1.replace_with(section) # replaces h1

def imageSpreads(soup):
	spreads = soup.find_all('span', class_='spread')
	if( spreads ):
		for spread in spreads:
			print(spread)
			img = spread.find("img")
			section = createSpreadSection(soup, img)
			spread.replace_with(section)
	return soup
	
def add_author_names_toc(soup):
	sub_headers = soup.findAll('h2')
	for sub_header in sub_headers:
		sub_header_headline = sub_header.find('span', class_='mw-headline')
		if sub_header_headline:
			sub_header_headline_id = sub_header_headline.get('id')
			# print("id",sub_header_headline_id)
		sibling_tag = sub_header.find_next_sibling('p')
		if sibling_tag:
			author_tag = sibling_tag.find('span', class_='author')
			# print("tag:",author_tag)
			if author_tag:
				author_text = author_tag.string
				# print("text",author_text)
				toc_2_item = soup.find(attrs={'href': f'#{ sub_header_headline_id }'})
				if (toc_2_item):
					try:
						toc_author = soup.new_tag('span', **{'class':'tocauthor'})
						toc_author.string = author_text
						toc_2_item.append(toc_author)
					except:
						print("Error copying author name(s)")
					# print("item",	toc_2_item)
	return soup

