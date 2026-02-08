import {Folder as FolderIcon} from 'lucide-react';
import './QuestionPanel.css';

function QuestionPanel({question})
{
    if (!question)
    {
        return (
            <div className="question-panel card">
                <div className="loading">Loading question...</div>
            </div>
        );
    }

    return (
        <div className="question-panel card">
            <div className="question-title-section">
                <h2>{question.title}</h2>
                <span className={`badge badge-${question.difficulty}`}>
                    {question.difficulty}
                </span>
            </div>

            <div className="question-category">
                <span><FolderIcon size={14} /> Category: {question.category}</span>
            </div>

            <p className="question-description">{question.description}</p>

            <div className="question-examples">
                <h4>Examples:</h4>
                {question.examples.map((example, index) => (
                    <div key={index} className="example-box">
                        <div className="example-row">
                            <strong>Input:</strong> <code>{example.input}</code>
                        </div>
                        <div className="example-row">
                            <strong>Output:</strong> <code>{example.output}</code>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default QuestionPanel;
