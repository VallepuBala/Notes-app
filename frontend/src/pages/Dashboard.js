import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Personal");
  const navigate = useNavigate();

  // Fetch Notes from API
  useEffect(() => {
    const fetchNotes = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:5000/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) setNotes(data);
      else alert("Failed to fetch notes");
    };

    fetchNotes();
  }, [navigate]);

  // Handle Note Submission
  const handleAddNote = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const response = await fetch("http://localhost:5000/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content, category }),
    });

    if (response.ok) {
      const newNote = await response.json();
      setNotes([newNote, ...notes]); // Add new note to the list
      setTitle("");
      setContent("");
    } else {
      alert("Failed to add note");
    }
  };

  // Handle Note Deletion
  const handleDeleteNote = async (id) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`http://localhost:5000/notes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      setNotes(notes.filter((note) => note.id !== id));
    } else {
      alert("Failed to delete note");
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  

  return (
    <div className="dashboard-container">
      {/* Logout button at top-right */}
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
  
      <h2>Dashboard</h2>
  
      {/* Add Note Form */}
      <form className="add-note-form" onSubmit={handleAddNote}>
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        
        <div className="textarea-select-container">
          <textarea placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} required />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Personal">Personal</option>
            <option value="Work">Work</option>
            <option value="Study">Study</option>
            <option value="Others">Others</option>
          </select>
        </div>
  
        <button type="submit">Add Note</button>
      </form>
  
      {/* Notes List */}
      <div className="notes-list">
        {notes.length === 0 ? <p>No notes available</p> : 
          notes.map((note) => (
            <div className="note-card" key={note.id}>
              <h3>{note.title}</h3>
              <p>{note.content}</p>
              <p><strong>Category:</strong> {note.category}</p>
              <button onClick={() => handleDeleteNote(note.id)}>Delete</button>
            </div>
          ))
        }
      </div>
    </div>
  );  
}

export default Dashboard;
