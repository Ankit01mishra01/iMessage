import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage, disconnectSocket } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webContainer.js'

function SyntaxHighlightedCode(props) {
    const ref = useRef(null)
    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)
            ref.current.removeAttribute('data-highlighted')
        }
    }, [props.className, props.children])
    return <code {...props} ref={ref} />
}

const Project = () => {
    const location = useLocation()
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState(new Set())
    const [project, setProject] = useState(location.state?.project)
    const [message, setMessage] = useState('')
    const [projectError, setProjectError] = useState('')
    const { user } = useContext(UserContext)
    const messageBox = useRef(null)

    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [fileTree, setFileTree] = useState({})
    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])
    const [webContainer, setWebContainer] = useState(null)
    const [iframeUrl, setIframeUrl] = useState(null)
    const [runProcess, setRunProcess] = useState(null)

    const handleUserClick = (id) => {
        const stringId = String(id)
        setSelectedUserId((prevSelectedUserId) => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(stringId)) {
                newSelectedUserId.delete(stringId);
            } else {
                newSelectedUserId.add(stringId);
            }
            return newSelectedUserId;
        });
    }

    function addCollaborators() {
        setProjectError('')
        if (!selectedUserId.size) {
            setProjectError('Select at least one user to invite.')
            return
        }

        axios.put('/projects/add-user', {
            projectId: project._id,
            users: Array.from(selectedUserId),
        }).then((res) => {
            setProject(res.data.project)
            setIsModalOpen(false)
            setSelectedUserId(new Set())
        }).catch((err) => {
            const responseData = err.response?.data
            const errorMessage = responseData?.error || responseData?.errors?.[0]?.msg || err.message || 'Failed to add collaborators.'
            console.error('Add collaborators error:', responseData || err)
            setProjectError(errorMessage)
        })
    }

    const send = () => {
        if (!message.trim()) return
        sendMessage('project-message', { message, sender: user })
        setMessages(prevMessages => [...prevMessages, { sender: user, message }])
        setMessage("")
    }

    function WriteAiMessage(message) {
        try {
            const messageObject = JSON.parse(message)
            return (
                <div className='overflow-auto bg-slate-900 text-white rounded p-2'>
                    <Markdown
                        children={messageObject.text}
                        options={{
                            overrides: {
                                code: SyntaxHighlightedCode,
                            },
                        }}
                    />
                </div>
            )
        } catch {
            return <p className='text-sm'>{message}</p>
        }
    }

    const navigate = useNavigate()

    useEffect(() => {
        if (!location.state?.project?._id) {
            navigate('/');
        }
    }, [location.state, navigate]);

    useEffect(() => {
        if (!project?._id) return;

        initializeSocket(project._id)

        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container)
            })
        }

        const handleProjectMessage = (data) => {
            if (data.sender._id === 'ai') {
                try {
                    const aiMessage = JSON.parse(data.message)
                    webContainer?.mount(aiMessage.fileTree)
                    if (aiMessage.fileTree) {
                        setFileTree(aiMessage.fileTree || {})
                    }
                } catch {
                    // non-JSON AI responses are rendered as text only
                }
            }
            setMessages(prevMessages => [...prevMessages, data])
        }

        receiveMessage('project-message', handleProjectMessage)

        axios.get(`/projects/get-project/${project._id}`).then(res => {
            setProject(res.data.project)
            setFileTree(res.data.project.fileTree || {})
        })

        axios.get(`/projects/${project._id}/messages`).then(res => {
            setMessages(res.data.messages || [])
        })

        axios.get('/users/all').then(res => {
            setUsers(res.data.users)
        })

        return () => {
            disconnectSocket()
        }
    }, [project?._id])

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
    }

    return (
        <main className='h-screen w-screen flex bg-slate-900'>
            {/* ── LEFT CHAT PANEL ── */}
            <section className="left relative flex flex-col h-screen w-96 bg-slate-800 border-r border-slate-700">
                
                {/* Header */}
                <header className='flex justify-between items-center p-4 bg-slate-900 border-b border-slate-700 sticky top-0 z-20'>
                    <div className='flex items-center gap-2'>
                        <h2 className='text-lg font-bold text-white'>{project?.name || 'Project'}</h2>
                    </div>
                    <button 
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} 
                        className='p-2 hover:bg-slate-700 rounded transition'
                        title='Show collaborators'
                    >
                        <i className="ri-group-fill text-slate-300"></i>
                    </button>
                </header>

                {/* Messages Area */}
                <div className="conversation-area flex-grow flex flex-col overflow-hidden relative">
                    <div
                        ref={messageBox}
                        className="message-box flex-grow overflow-y-auto p-4 flex flex-col gap-3 scroll-smooth"
                    >
                        {messages.length === 0 ? (
                            <div className='flex items-center justify-center h-full text-slate-500'>
                                <p className='text-center'>No messages yet. Start chatting!</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <div
                                    key={`${msg.sender._id}-${index}`}
                                    className={`flex ${msg.sender._id === user._id.toString() ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-xs rounded-lg p-3 ${
                                            msg.sender._id === user._id.toString()
                                                ? 'bg-violet-600 text-white'
                                                : msg.sender._id === 'ai'
                                                ? 'bg-slate-700 text-slate-100'
                                                : 'bg-slate-700 text-slate-100'
                                        }`}
                                    >
                                        <div className='text-xs opacity-75 mb-1'>{msg.sender.email}</div>
                                        <div className='text-sm'>
                                            {msg.sender._id === 'ai'
                                                ? WriteAiMessage(msg.message)
                                                : <p>{msg.message}</p>
                                            }
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="input-area flex gap-2 p-4 bg-slate-900 border-t border-slate-700">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && send()}
                            className='flex-grow bg-slate-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-500'
                            type="text"
                            placeholder='Type message or @ai for assistance'
                        />
                        <button
                            onClick={send}
                            className='px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition'
                        >
                            <i className="ri-send-plane-fill"></i>
                        </button>
                    </div>
                </div>

                {/* Side Panel - Collaborators */}
                <div
                    className={`absolute inset-0 bg-slate-900 border-r border-slate-700 transition-transform duration-300 z-30 flex flex-col ${
                        isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <header className='flex justify-between items-center p-4 bg-slate-800 border-b border-slate-700'>
                        <h3 className='text-lg font-semibold text-white'>Collaborators</h3>
                        <button
                            onClick={() => setIsSidePanelOpen(false)}
                            className='p-2 hover:bg-slate-700 rounded transition'
                        >
                            <i className="ri-close-fill text-slate-300"></i>
                        </button>
                    </header>
                    <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-2">
                        {project?.users && project.users.map((collaborator) => (
                            <div
                                key={String(collaborator._id || collaborator)}
                                className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
                            >
                                <div className='w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold'>
                                    {collaborator.email?.[0].toUpperCase() || '?'}
                                </div>
                                <div className='flex-grow'>
                                    <p className='text-sm text-white font-medium'>{collaborator.email || 'Unknown'}</p>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={() => {
                                setIsSidePanelOpen(false)
                                setIsModalOpen(true)
                            }}
                            className='mt-4 w-full py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition flex items-center justify-center gap-2'
                        >
                            <i className="ri-add-fill"></i>
                            Add Collaborator
                        </button>
                    </div>
                </div>
            </section>

            {/* ── RIGHT CODE EDITOR PANEL ── */}
            <section className="right flex-grow h-full flex flex-col bg-slate-900">
                
                {/* File Explorer + Code Editor */}
                <div className="flex flex-grow overflow-hidden">
                    
                    {/* File Explorer */}
                    <div className="explorer w-64 bg-slate-800 border-r border-slate-700 flex flex-col overflow-hidden">
                        <div className='p-4 bg-slate-900 border-b border-slate-700'>
                            <h3 className='text-sm font-semibold text-slate-300 uppercase tracking-wide'>Files</h3>
                        </div>
                        <div className="file-tree flex-grow overflow-y-auto">
                            {Object.keys(fileTree).length === 0 ? (
                                <p className='text-slate-500 text-sm p-4'>No files yet</p>
                            ) : (
                                Object.keys(fileTree).map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setCurrentFile(file)
                                            setOpenFiles([...new Set([...openFiles, file])])
                                        }}
                                        className={`w-full text-left p-3 flex items-center gap-2 hover:bg-slate-700 transition ${
                                            currentFile === file ? 'bg-violet-600 text-white' : 'text-slate-300'
                                        }`}
                                    >
                                        <i className="ri-file-code-line"></i>
                                        <span className='text-sm truncate'>{file}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Code Editor */}
                    <div className="code-editor flex-grow flex flex-col overflow-hidden">
                        
                        {/* Tabs */}
                        <div className="flex gap-0 bg-slate-800 border-b border-slate-700 overflow-x-auto">
                            {openFiles.map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentFile(file)}
                                    className={`px-4 py-2 text-sm whitespace-nowrap transition border-b-2 ${
                                        currentFile === file
                                            ? 'bg-slate-700 text-white border-violet-600'
                                            : 'text-slate-400 border-transparent hover:text-slate-200'
                                    }`}
                                >
                                    <i className="ri-file-code-line mr-2"></i>
                                    {file}
                                </button>
                            ))}
                        </div>

                        {/* Code Content */}
                        <div className="flex-grow overflow-auto bg-slate-900">
                            {fileTree[currentFile] ? (
                                <pre className="h-full p-4 font-mono text-sm text-slate-100 overflow-auto">
                                    <code
                                        className="outline-none"
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const updatedContent = e.currentTarget.innerText;
                                            const ft = {
                                                ...fileTree,
                                                [currentFile]: {
                                                    file: {
                                                        contents: updatedContent
                                                    }
                                                }
                                            }
                                            setFileTree(ft)
                                            saveFileTree(ft)
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: hljs.highlight('javascript', fileTree[currentFile].file.contents).value
                                        }}
                                    />
                                </pre>
                            ) : (
                                <div className='h-full flex items-center justify-center text-slate-500'>
                                    <p>Select a file to view</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Run Button & Preview */}
                {iframeUrl && webContainer ? (
                    <div className="preview-section flex-grow flex flex-col bg-white border-t border-slate-700 overflow-hidden">
                        <div className="address-bar flex items-center gap-2 p-2 bg-slate-100 border-b border-slate-300">
                            <i className="ri-global-line text-slate-600"></i>
                            <input
                                type="text"
                                onChange={(e) => setIframeUrl(e.target.value)}
                                value={iframeUrl}
                                className='flex-grow px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-violet-500'
                            />
                        </div>
                        <iframe src={iframeUrl} className="flex-grow w-full border-none"></iframe>
                    </div>
                ) : (
                    <div className="run-section flex items-center justify-center p-4 bg-slate-800 border-t border-slate-700">
                        <button
                            onClick={async () => {
                                if (!webContainer || !fileTree) return
                                await webContainer.mount(fileTree)
                                const installProcess = await webContainer.spawn("npm", ["install"])
                                installProcess.output.pipeTo(new WritableStream({
                                    write(chunk) {
                                        console.log(chunk)
                                    }
                                }))
                                if (runProcess) {
                                    runProcess.kill()
                                }
                                let tempRunProcess = await webContainer.spawn("npm", ["start"]);
                                tempRunProcess.output.pipeTo(new WritableStream({
                                    write(chunk) {
                                        console.log(chunk)
                                    }
                                }))
                                setRunProcess(tempRunProcess)
                                webContainer.on('server-ready', (port, url) => {
                                    console.log(port, url)
                                    setIframeUrl(url)
                                })
                            }}
                            className='px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition flex items-center gap-2'
                        >
                            <i className="ri-play-fill"></i>
                            Run Project
                        </button>
                    </div>
                )}
            </section>

            {/* ── ADD COLLABORATOR MODAL ── */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl w-full max-w-md border border-slate-700 shadow-xl">
                        <div className='flex justify-between items-center p-6 border-b border-slate-700'>
                            <h2 className='text-xl font-bold text-white'>Add Collaborators</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className='p-2 hover:bg-slate-700 rounded transition'
                            >
                                <i className="ri-close-fill text-slate-300"></i>
                            </button>
                        </div>

                        {projectError && (
                            <div className='mx-6 mt-4 p-3 bg-red-900 border border-red-700 text-red-200 rounded-lg text-sm'>
                                {projectError}
                            </div>
                        )}

                        <div className="flex-grow max-h-96 overflow-y-auto p-6">
                            {users.map(userItem => (
                                <div
                                    key={String(userItem._id)}
                                    onClick={() => handleUserClick(userItem._id)}
                                    className={`p-3 rounded-lg mb-2 cursor-pointer transition flex items-center gap-3 ${
                                        Array.from(selectedUserId).includes(String(userItem._id))
                                            ? 'bg-violet-600 text-white'
                                            : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                    }`}
                                >
                                    <div className='w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold'>
                                        {userItem.email[0].toUpperCase()}
                                    </div>
                                    <p className='text-sm'>{userItem.email}</p>
                                </div>
                            ))}
                        </div>

                        <div className='flex gap-2 p-6 border-t border-slate-700'>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className='flex-grow py-2 px-4 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addCollaborators}
                                className='flex-grow py-2 px-4 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition font-medium'
                            >
                                Add Selected
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Project