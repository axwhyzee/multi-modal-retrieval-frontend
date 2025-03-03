import { useRef, useState } from "react";
import "./app.css";

const API_URL = process.env.REACT_APP_API_URL;
const USER = process.env.REACT_APP_USER;
const TOP_N = 8;

function get_obj_url(key) {
  return `${API_URL}/get/${key}`
}

async function fetch_doc_txt(key) {
  const chunk_req = await fetch(get_obj_url(key));
  const blob = await chunk_req.blob();
  const text = await blob.text();
  return text;
}

function App() {
  const inputRef = useRef(null);  // refs query text
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);  // query results
  const [showResults, setShowResults] = useState(null);  // show filtered results
  const [expanded, setExpanded] = useState(null);  // expand doc on click
  const [highlightTextChunk, setHighlightTextChunk] = useState(null);  // in text docs, chunks are highlighted on click

  async function expand(doc, modal) {
    doc = structuredClone(doc);
    doc.modal = modal;
  
    // 1. fetch actual text data
    // 2. separate text into chunks that highlight on click
    if (modal === "TEXT") {
      const uncut = await fetch_doc_txt(doc.doc_key);
      const cuts = [];
      const chunks = doc.chunk_keys;

      // find splitting points
      for (let chunk_i=0; chunk_i<chunks.length; chunk_i++) {
        const cut = uncut.indexOf(chunks[chunk_i]);
        cuts.push([cut, chunk_i]);
      }
      cuts.sort((a,b) => a[0]-b[0]);  // sort by first cut

      // map splits to corresponding chunk indices
      const splits = [];
      let prev = 0;
      for (const [cut, chunk_i] of cuts) {
        splits.push([uncut.substring(prev, cut), -1])  // non-chunk
        prev = cut+chunks[chunk_i].length;
        splits.push([uncut.substring(cut, prev), chunk_i])  // chunk
      }
      splits.push([uncut.substring(prev, uncut.length), -1])  // tail (non-chunk)
      doc.splits = splits;
    }
    setExpanded(doc);
  }

  async function send_query() {
      const query = inputRef.current.value;

      if (!query) return;

      const params = new URLSearchParams({ text: query, user: USER, top_n: TOP_N });

      setResults(null);
      setLoading(true);

      const req = await fetch(`${API_URL}/query/text?${params}`)
      const json = await req.json();

      // convert text chunk keys into their actual texts
      for (const doc of json.TEXT) {
        for (let i=0; i<doc.chunk_keys.length; i++) {
            doc.chunk_keys[i] = await fetch_doc_txt(doc.chunk_keys[i]);
        }
      }
      setResults(json);
      setShowResults(json);
      setLoading(false);
  }

  return (
    <div className="App">
      <section class="query-container">
        <input class="query-input" type="text" ref={inputRef} placeholder="Search" />
        <button class="query-btn" onClick={send_query}>&#8981;</button>
      </section>
      <section class="nav-tabs">
        {results && (<span class="tab" onClick={() => setShowResults(results)}>ALL</span>)}
        {results && Object.keys(results).map((key) => <span class="tab" onClick={() => setShowResults({[key]: results[key]})}>{key}</span>)}
      </section>
      <div class="grid">
        {
          loading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          )
        }
        {showResults && Object.entries(showResults).map(([modal, docs]) => (
          <>
          {
            expanded && (
              <div class="expanded-container">
                <button class="expanded-close-btn" onClick={() => setExpanded(null) ^ setHighlightTextChunk(null)}>X</button>
                <div class="expanded-inner-container">
                {
                  expanded.modal === "TEXT" ? (
                    <div class="expanded-content-container">
                      <div class="expanded-content expanded-text">
                        {
                          expanded.splits.map(([text, chunk_i]) => (
                              <span class={highlightTextChunk == chunk_i && "text-highlight"}>{text}</span>
                            ))
                        }
                      </div>
                      <div class="row-chunks">
                          {
                            expanded.chunk_keys.map((chunk_key, i) => (
                              <div class="chunk" onClick={() => setHighlightTextChunk(i)}>
                                <div class="chunk-text">{chunk_key}</div>
                              </div>
                            ))
                          }
                      </div>
                    </div>
                  ) : expanded.modal === "IMAGE" ? (
                    <img class="expanded-image" src={get_obj_url(expanded.doc_key)}/>
                  ) : expanded.modal === "VIDEO" ? (
                    <div class="expanded-content-container">
                      <video class="expanded-content" src={get_obj_url(expanded.doc_key)} controls={true}></video>
                      <div class="row-chunks">
                          {
                            expanded.chunk_keys.map((chunk_key, _) => (
                              <div class="chunk">
                                <img class="chunk-thumb" src={API_URL + "/get/" + chunk_key}/>
                              </div>
                            ))
                          }
                      </div>
                    </div>
                  ) : (
                    <p>Unrecognized modal [{expanded.modal}]</p>
                  )
                }
                </div>
              </div>
            )
          }
          {
            docs.map((doc, _) => (
              <div class="doc" onClick={() => expand(doc, modal)}>
                  <div class="doc-header">
                    <div class="doc-icon">
                    {
                      modal == "IMAGE" ? (
                        <i class="icon-orange fa-solid fa-file-image"></i>
                      ) : modal == "TEXT" ? (
                        <i class="icon-blue fa-solid fa-file-lines"></i>
                      ) : modal == "VIDEO" ? (
                        <i class="icon-red fa-solid fa-film"></i>
                      ) : <></>
                    }
                    </div>
                    <div class="doc-filename">{doc.doc_filename}</div>
                  </div>
                  
                  <div class="doc-thumb-container"><img class="doc-thumb" src={get_obj_url(doc.doc_thumb_key)} /></div>
              </div>
            ))
          }
          </>
        ))}
      </div>
    </div>
  );
}

export default App;
