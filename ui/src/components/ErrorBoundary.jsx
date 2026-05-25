import { Component } from 'react';
import { clearStoredState } from '../utils/storage';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReset = () => {
    clearStoredState();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h1>화면을 불러오지 못했습니다</h1>
          <p>저장된 데이터 문제일 수 있습니다. 아래 버튼으로 초기화해 보세요.</p>
          <button type="button" className="btn btn-primary" onClick={this.handleReset}>
            데이터 초기화 후 다시 시작
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
