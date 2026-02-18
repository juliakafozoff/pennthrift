import api from '../api/http';
import React from 'react';
import { Component } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge } from './ui';
const placeholder = require('../assets/placeholder_item.png');
export default class ProfileListings extends Component {
  state = {
    items: [],
  };
  constructor(props) {
    super(props);
    this.setState({ items: [...props.data] });
  }
  componentDidMount() {
    if (this.state.items != this.props.data) {
      this.setState({ items: this.props.data });
    }
  }
  componentDidUpdate() {
    if (this.state.items != this.props.data) {
      this.setState({ items: this.props.data });
    }
  }

  delete(id) {
    api.delete('/api/item/delete/' + id).then((res) => this.props.refresh());
  }

  render() {
    const itemsSafe = Array.isArray(this.state.items) ? this.state.items : [];
    
    return (
      <div
        data-testid="profilelistings"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {/* Add New Item Card */}
        <Link to="/profile/newitem" className="block">
          <Card className="h-full flex flex-col items-center justify-center min-h-[280px] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors cursor-pointer group">
            <div className="mb-4 p-4 rounded-lg bg-[var(--color-surface-2)] group-hover:bg-[var(--color-primary-light)] transition-colors">
              <img
                className="h-16 w-16 opacity-60"
                src={require('../assets/placeholder_item_rd.png')}
                alt="Add item"
              />
            </div>
            <div className="flex items-center gap-2 text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
              <span className="font-medium">Add new item</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </Card>
        </Link>
        
        {/* Item Cards */}
        {itemsSafe.map((item) => {
          if (!item || !item._id) return null;
          
          return (
            <Card key={item._id} className="relative group">
              <button
                onClick={() => this.delete(item._id)}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-danger)]"
                aria-label="Delete item"
              >
                <img
                  className="w-4 h-4"
                  src={require('../assets/delete.png')}
                  alt="Delete"
                />
              </button>
              
              <Link to={`/store/item/${item._id}`}>
                <img
                  src={item.image || placeholder}
                  alt={item.name || 'Item'}
                  className="w-full h-48 object-cover rounded-lg mb-4 border border-[var(--color-border)]"
                />
              </Link>
              
              <div className="space-y-2">
                {item.category && (
                  <Badge variant="default">{item.category}</Badge>
                )}
                <div>
                  <h3 className="font-semibold text-[var(--color-text)] truncate">{item.name || 'Untitled'}</h3>
                  <p className="text-lg font-medium text-[var(--color-primary)] mt-1">
                    ${item.price ? parseFloat(item.price).toFixed(2) : '0.00'}
                  </p>
                </div>
                {item.owner && (
                  <Link
                    to={`/user/${item.owner}`}
                    className="text-sm text-[var(--color-primary)] hover:underline block truncate"
                  >
                    @{item.owner}
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  }
}
