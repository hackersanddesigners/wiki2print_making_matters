import flask
from flask_plugin import Plugin
from flask import redirect, url_for, request
from api import *
from bs4 import BeautifulSoup
import re	
# this madness is apparently necessary to import web-interface.py
# TODO: we only need web-interface for the constants, maybe remove?
import os,sys,inspect
current_dir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir) 
import importlib  
app = importlib.import_module("web-interface")
sketch = 0

plugin = Plugin(
		static_folder='static',
		template_folder='template'
)
	
@plugin.route('/pdf/<string:pagename>', methods=['GET', 'POST'])
def pagedjs(pagename):	
	publication = get_publication(
		app.WIKI,
		app.SUBJECT_NS,
		app.STYLES_NS,
		pagename,
		app.manager
	)
	sketch = request.args.get("sketch", default=0, type=int)
	grid = request.args.get("grid", default=0, type=int)
	return filter(flask.render_template(
		'Making_Matters_Lexicon.html', 
		title = pagename,
		html  = publication['html'],
		sketch = sketch,
		grid = grid,
	))
	
def filter(html):
	print("filtering...")	
	soup = BeautifulSoup(html, 'html.parser')
	soup = add_author_names_toc(soup)
	soup = insertEmptyPageAfterTitle(soup)
	html = soup.prettify()
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
	for h1 in h1s:
		cls = {'class': 'empty_page'}
		new_tag = soup.new_tag("span", **cls)
		h1.insert_after(new_tag)
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

