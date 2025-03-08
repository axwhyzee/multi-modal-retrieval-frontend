import { useRef, useState } from "react";
import "./app.css";
import { get_file_ext, make_text_query, get_obj_url, fetch_txt } from "./utils";
import { 
  TXT_SUFFIX, 
  IMG_SUFFIXES,
  PDF_SUFFIX,
  VID_SUFFIXES,
  DOCTYPE_IMAGE,
  DOCTYPE_PDF,
  DOCTYPE_TEXT,
  DOCTYPE_VIDEO
} from "./consts";


function App() {
  const inputRef = useRef(null);  // ref to query text input
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);  // query results
  const [showResults, setShowResults] = useState(null);  // show filtered results based on nav
  const [expanded, setExpanded] = useState(null);  // on click of doc, process doc additionally for extra doc details
  const [highlightTextChunk, setHighlightTextChunk] = useState(null);  // in text docs, chunks are highlighted on click

  async function expand(doc, doctype) {
    doc = structuredClone(doc);
    doc.doctype = doctype;
    doc.chunk_vals = structuredClone(doc.chunk_keys);

    // convert text keys into their text values
    for (let i=0; i<doc.chunk_keys.length; i++) {
      if (get_file_ext(doc.chunk_keys[i]) === TXT_SUFFIX)
        doc.chunk_vals[i] = (await (fetch_txt(doc.chunk_keys[i]))).trim();
    }
  
    // 1. fetch actual text data
    // 2. separate text into chunks that highlight on click
    if (doctype === DOCTYPE_TEXT) {
      const uncut = await fetch_txt(doc.doc_key);
      const cuts = [];

      // find splitting points
      for (let i=0; i<doc.chunk_vals.length; i++) {
        const cut = uncut.indexOf(doc.chunk_vals[i]);
        cuts.push([cut, i]);
        
      }

      cuts.sort((a,b) => a[0]-b[0]);  // sort by index of cuts

      // map splits to corresponding chunk indices
      const splits = [];
      let prev_i = 0;
      for (const [cut, i] of cuts) {
        splits.push([uncut.substring(prev_i, cut), -1])  // non-chunk
        prev_i = cut + doc.chunk_vals[i].length;
        splits.push([uncut.substring(cut, prev_i), i])  // chunk
      }
      splits.push([uncut.substring(prev_i, uncut.length), -1])  // tail (non-chunk)
      doc.splits = splits;

    }
    setExpanded(doc);
  }

  async function send_query() {
      const text = inputRef.current.value;

      if (!text) return;

      setResults(null);
      setLoading(true);

      const res = await make_text_query(text);
      const docs = {TEXT: [], VIDEO: [], IMAGE: [], PDF: []};

      for (const doc of res) {
        const suffix = get_file_ext(doc.doc_key);
        if (suffix === TXT_SUFFIX) docs.TEXT.push(doc);
        else if (suffix === PDF_SUFFIX) docs.PDF.push(doc);
        else if (IMG_SUFFIXES.includes(suffix)) docs.IMAGE.push(doc);
        else if (VID_SUFFIXES.includes(suffix)) docs.VIDEO.push(doc);
      }
      setResults(docs);
      setShowResults(docs);
      setLoading(false);
  }

  return (
    <div className="App">
      {/* Query Box */}
      <section class="query-container">
        <input class="query-input" type="text" ref={inputRef} placeholder="Search" />
        <button class="query-btn" onClick={send_query}>&#8981;</button>
      </section>

      {/* Navigation (for results) */}
      <section class="nav-tabs">
        {results && (<span class="tab" onClick={() => setShowResults(results)}>ALL</span>)}
        {results && Object.keys(results).map((key) => <span class="tab" onClick={() => setShowResults({[key]: results[key]})}>{key}</span>)}
      </section>

      {/* Expanded Doc */}
      <div class="expanded-container" style={{"max-height": expanded ? "100%" : 0}}>
        <button class="expanded-close-btn" onClick={() => setExpanded(null) ^ setHighlightTextChunk(null)}>X</button>
        <div class="expanded-inner-container">
            {
              expanded === null ? <></> :
              expanded.doctype === DOCTYPE_TEXT ? (
                <div class="expanded-content-container">
                  <div id="scrollable-container" class="expanded-content expanded-text">
                    {
                      expanded.splits.map(([chunk, i]) => (
                          <pre class={highlightTextChunk===i && "text-highlight"}>{chunk}</pre>
                        ))
                    }
                  </div>
                  <div class="row-chunks">
                      {
                        expanded.chunk_vals.map((chunk, i) => (
                          <a class="chunk" onClick={() => setHighlightTextChunk(i)}>
                            <pre class="chunk-text">{chunk}</pre>
                          </a>
                        ))
                      }
                  </div>
                </div>
              ) : expanded.doctype === DOCTYPE_IMAGE ? (
                <img class="expanded-image" src={get_obj_url(expanded.doc_key)}/>
              ) : expanded.doctype === DOCTYPE_VIDEO ? (
                <div class="expanded-content-container">
                  <video class="expanded-content" src={get_obj_url(expanded.doc_key)} controls={true}></video>
                  <div class="row-chunks">
                      {
                        expanded.chunk_vals.map((chunk, _) => (
                          <div class="chunk">
                            <img class="chunk-thumb" src={get_obj_url(chunk)}/>
                          </div>
                        ))
                      }
                  </div>
                </div>
              ) : expanded.doctype === DOCTYPE_PDF ? (
                <div class="expanded-content-container">
                  <object data={get_obj_url(expanded.doc_key)}
                          type='application/pdf' 
                          width='100%' height='100%'>
                  </object>
                  <div class="row-chunks">
                    {
                      expanded.chunk_vals.map((chunk, i) => get_file_ext(expanded.chunk_keys[i]) === ".txt" ? (
                        <div class="chunk">
                          <pre class="chunk-text">{chunk}</pre>
                        </div>
                      ) : (
                        <div class="chunk">
                          <img class="chunk-thumb" src={get_obj_url(chunk)}/>
                        </div>
                      ))
                    }
                  </div>
                </div>
              ) : (
                <p>Unrecognized doctype [{expanded.doctype}]</p>
              )
            }
        </div>
      </div>

      {/* Results Grid */}
      <div class="grid">
        {
          // loading spinner
          loading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          )
        }
        {
          // filter presented results depending on nav tab
          showResults && Object.entries(showResults).map(([doctype, docs]) => (
            docs.map((doc, _) => (
              <div class="doc" onClick={() => expand(doc, doctype)}>
                  <div class="doc-header">
                    <div class="doc-icon">
                    {
                      doctype === "IMAGE" ? (
                        <i class="icon-orange fa-solid fa-file-image"></i>
                      ) : doctype === "TEXT" ? (
                        <i class="icon-blue fa-solid fa-file-lines"></i>
                      ) : doctype === "VIDEO" ? (
                        <i class="icon-red fa-solid fa-film"></i>
                      ) : doctype === "PDF" ? (
                        <i class="icon-red fa-solid fa-file-pdf"></i>
                      ) : <></>
                    }
                    </div>
                    <div class="doc-filename">{doc.doc_filename}</div>
                  </div>
                  <div class="doc-thumb-container"><img class="doc-thumb" src={get_obj_url(doc.doc_thumb_key)} /></div>
              </div>
            ))))
          }
      </div>
    </div>
  );
}

export default App;
