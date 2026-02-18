import api from '../api/http';
import React from 'react';
import { Component } from 'react';
import { Link } from 'react-router-dom';
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
    return (
      <div
        data-testid="profilelistings"
        className="grid justify-center mt-10 sm:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-2"
      >
        <div className="w-full border flex flex-col justify-center w-fit items-center border-[#368481] ">
          <div className="border-[#368481] bg-[#00000033] mx-5 mt-5  p-2 rounded-lg border">
            <img
              className="h-40 w-40"
              src={require('../assets/placeholder_item_rd.png')}
            />
          </div>

          <div className="flex items-center mt-10 m-2 self-end">
            <div>Add new Item </div>
            <Link to="/profile/newitem">
              <img className="w-8 h-8" src={require('../assets/plus.png')} />
            </Link>
          </div>
        </div>
        {this.state.items.map((item) => {
          return (
            <div
              key={item._id}
              className="border-2 w-56 p-5 border-[#368481] w-fit"
            >
              <img
                className="w-4 cursor-pointer h-4 mb-2"
                onClick={() => this.delete(item._id)}
                src={require('../assets/delete.png')}
              />
              <img
                src={item.image || placeholder}
                className="w-full border-[#368481] rounded-lg border-2 h-36"
              />
              <div className="flex mt-5 text-xs gap-5">
                <div className="font-bold">{item.category}</div>
                <div className="flex gap-2 flex-col">
                  <div>{item.name}</div>
                  <div> ${item.price}</div>
                  <Link
                    to={`/user/${item.owner}`}
                    className="text-blue-600 w-18 truncate overflow-ellipsis underline"
                  >
                    @{item.owner}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}
