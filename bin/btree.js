var insert = function (cell) {
  if (!this.root) this.root = cell;
  else {
    let current = this.root;
    while (current) {
      if (current.maximum > cell.maximum) {
        if (!current.left) {
          current.left = cell;
          break;
        }
        else current = current.left;
      } else if (current.maximum < cell.maximum) {
        if (!current.right) {
          current.right = cell;
          break;
        }
        else current = current.right;
      }
      else break;
    }
  }
  return this.root;
};

var reorder = function () {
  let final = [];
  return function _reorder () {
    let current = [...arguments].reduce((result, cells) => {
      let middle = Math.floor(cells.length / 2);
      let left = cells.splice(0, middle);
      let right = cells.splice(1);
      final.push(cells[0]);
      if (left.length) result.push(left);
      if (right.length) result.push(right);
      return result;
    }, []);
    if (!current.length) return final;
    return _reorder(...current);
  };
};